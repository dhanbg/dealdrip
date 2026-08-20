"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  HelpCircle,
  Home,
  Clock,
  Zap,
  Radio,
} from "lucide-react";

interface RenderProfile {
  antialias: boolean;
  anisotropy: number;
  isMobile: boolean;
  isLowPower: boolean;
  maxFps: number;
  modelUrl: string;
  pixelRatio: number;
  shadows: boolean;
  textureScale: number;
}

type NavigatorWithPerformanceHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
};

function createRenderProfile(): RenderProfile {
  const hints = navigator as NavigatorWithPerformanceHints;
  const deviceMemory = hints.deviceMemory ?? 4;
  const processorCount = navigator.hardwareConcurrency ?? 4;
  const isMobile = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
  const slowConnection = ["slow-2g", "2g"].includes(
    hints.connection?.effectiveType ?? ""
  );
  const isLowPower =
    hints.connection?.saveData === true ||
    slowConnection ||
    deviceMemory <= 2 ||
    processorCount <= 2;

  const pixelRatio = isLowPower
    ? 1
    : isMobile
      ? Math.min(window.devicePixelRatio, 1.25)
      : Math.min(window.devicePixelRatio, 1.75);

  return {
    antialias: !isMobile && !isLowPower,
    anisotropy: isLowPower ? 1 : isMobile ? 2 : 8,
    isMobile,
    isLowPower,
    maxFps: 60,
    modelUrl: isMobile || isLowPower
      ? "/speaker-mobile.glb"
      : "/speaker-optimized.glb",
    pixelRatio,
    shadows: !isMobile && !isLowPower,
    textureScale: isMobile || isLowPower ? 0.5 : 1,
  };
}

const RENDER_PROFILES = new WeakMap<THREE.WebGLRenderer, RenderProfile>();

function getRenderProfile(renderer: THREE.WebGLRenderer): RenderProfile {
  const profile = RENDER_PROFILES.get(renderer);
  if (!profile) throw new Error("Renderer profile was not initialized.");
  return profile;
}

function getResponsiveCameraPosition(
  position: readonly [number, number, number]
): THREE.Vector3 {
  const mobileScale = window.matchMedia("(max-width: 640px)").matches ? 1.16 : 1;
  return new THREE.Vector3(...position).multiplyScalar(mobileScale);
}

function disposeObjectResources(root: THREE.Object3D) {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  const disposedMaterials = new Set<THREE.Material>();
  const disposedTextures = new Set<THREE.Texture>();

  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry && !disposedGeometries.has(mesh.geometry)) {
      disposedGeometries.add(mesh.geometry);
      mesh.geometry.dispose();
    }

    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];

    materials.forEach((material) => {
      if (disposedMaterials.has(material)) return;
      disposedMaterials.add(material);

      Object.values(material).forEach((value) => {
        if (
          value instanceof THREE.Texture &&
          !disposedTextures.has(value)
        ) {
          disposedTextures.add(value);
          value.dispose();
        }
      });
      material.dispose();
    });
  });
}

function createLightweightContactShadow(profile: RenderProfile): THREE.Mesh {
  const canvas = document.createElement("canvas");
  const size = profile.isLowPower ? 64 : 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.05,
    size / 2,
    size / 2,
    size * 0.48
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.48)");
  gradient.addColorStop(0.55, "rgba(0, 0, 0, 0.24)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.65, 0.82),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
  );
  shadow.name = "lightweight-contact-shadow";
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.535;
  shadow.renderOrder = 0;
  return shadow;
}

interface RgbColorOption {
  id: string;
  name: string;
  hex: string;
  isRainbow?: boolean;
}

const RGB_COLOR_OPTIONS: RgbColorOption[] = [
  {
    id: "rainbow",
    name: "Spectrum Flow (Cycle All)",
    hex: "#00f0ff",
    isRainbow: true,
  },
  {
    id: "cyan",
    name: "Ocean Cyan",
    hex: "#00f0ff",
  },
  {
    id: "purple",
    name: "Neon Violet",
    hex: "#b829ff",
  },
  {
    id: "coral",
    name: "Sunset Coral",
    hex: "#ff2a5f",
  },
  {
    id: "emerald",
    name: "Emerald Green",
    hex: "#00ff88",
  },
  {
    id: "amber",
    name: "Warm Amber",
    hex: "#ffb703",
  },
  {
    id: "blue",
    name: "Deep Blue",
    hex: "#2563eb",
  },
  {
    id: "white",
    name: "Moonlight White",
    hex: "#ffffff",
  },
];

interface Hotspot {
  id: string;
  name: string;
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
  icon: typeof Clock;
  description: string;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: "overview",
    name: "360° Overview",
    cameraPos: [0, 0.2, 2.2],
    targetPos: [0, 0, 0],
    icon: Clock,
    description: "Deal Drip 15W front face with LED digital clock, dual alarms and ambient RGB ring.",
  },
  {
    id: "top-qi",
    name: "Top Qi & RGB Ring",
    cameraPos: [0, 2.4, 0.6],
    targetPos: [0, 0.1, 0],
    icon: Zap,
    description: "Top-mounted 15W fast Qi pad with perimeter RGB glowing light ring.",
  },
  {
    id: "side-mesh",
    name: "Acoustic Fabric",
    cameraPos: [2.2, 0.4, 0.8],
    targetPos: [0, 0, 0],
    icon: Radio,
    description: "Full-range audio driver behind textured fabric mesh.",
  },
];

// These Tripo-generated nodes are the original rear capsule, its four ports,
// and the stray control hanging below it. They are safe to hide because the
// replacement panel below is attached only to the rear face.
const LEGACY_REAR_PART_NAMES = new Set([
  "tripo_part_3",
  "tripo_part_14",
  "tripo_part_15",
  "tripo_part_16",
  "tripo_part_17",
  "tripo_part_19",
]);

// Raised generated meshes for the old fuzzy front clock and its AM/PM label.
// Functional button meshes are intentionally not included.
const LEGACY_FRONT_DISPLAY_PART_NAMES = new Set([
  "tripo_part_5",
  "tripo_part_10",
  "tripo_part_21",
  "tripo_part_23",
]);

// The supplied top mesh contains the diagonal carbon lines and damaged Qi
// artwork. It is fully replaced by the clean assembly created below.
const LEGACY_TOP_PART_NAMES = new Set(["tripo_part_1"]);

// Three generated feet are standalone nodes; the fourth is partially welded
// into the main shell and is clipped by its measured footprint below.
const LEGACY_FOOT_PART_NAMES = new Set([
  "tripo_part_2",
  "tripo_part_6",
  "tripo_part_8",
]);

const BOTTOM_FOOT_LAYOUT = {
  centers: [
    [-0.3, -0.18],
    [0.3, -0.18],
    [-0.3, 0.18],
    [0.3, 0.18],
  ] as const,
  collarRadiusTop: 0.036,
  collarRadiusBottom: 0.033,
  collarHeight: 0.028,
  padRadius: 0.0225,
} as const;

const LEGACY_WELDED_FRONT_RIGHT_FOOT = {
  centerX: 0.374,
  centerZ: 0.223,
  radiusX: 0.032,
  radiusZ: 0.032,
  maxY: 0.052,
} as const;

// Measured from the convex X/Z outline of the supplied tripo_part_1 vertices.
// Keeping these source measurements together lets every replacement layer use
// a true concentric inset instead of independently guessed dimensions/radii.
const TOP_SURFACE_MEASUREMENTS = {
  width: 0.917633056640625,
  depth: 0.52874755859375,
  radius: 0.12396,
  centerX: -0.0001678466796875,
  centerZ: 0.0008849501609802,
} as const;

// Ellipses fitted to the front-facing ring vertices in the supplied GLB. The
// two already-correct centre controls retain their existing visible diameter;
// the other five use their measured centre, width, height, and corner radius.
// A shallow intersecting body is added below each face so the controls read as
// molded hardware rather than decals floating above the speaker.
const FRONT_BUTTON_FITS = [
  {
    centerX: -0.26929097,
    centerY: 0.12919341,
    width: 0.04827225,
    height: 0.04794586,
    radius: 0.02397293,
    frontZ: 0.30715942,
  },
  {
    centerX: -0.17502298,
    centerY: 0.12793914,
    width: 0.04437995,
    height: 0.04415098,
    radius: 0.02207549,
    frontZ: 0.30847168,
  },
  {
    centerX: -0.084,
    centerY: 0.131,
    width: 0.0478125,
    height: 0.0478125,
    radius: 0.02390625,
    frontZ: 0.30841061,
  },
  {
    centerX: 0,
    centerY: 0.131,
    width: 0.0478125,
    height: 0.0478125,
    radius: 0.02390625,
    frontZ: 0.30831906,
  },
  {
    centerX: 0.08509244,
    centerY: 0.12791581,
    width: 0.04441245,
    height: 0.04433104,
    radius: 0.02216552,
    frontZ: 0.30841061,
  },
  {
    centerX: 0.17469603,
    centerY: 0.12753786,
    width: 0.04435334,
    height: 0.04529598,
    radius: 0.02217667,
    frontZ: 0.30801386,
  },
  {
    centerX: 0.2671069,
    centerY: 0.12943696,
    width: 0.04623176,
    height: 0.04520472,
    radius: 0.02260236,
    frontZ: 0.30728143,
  },
] as const;
const FRONT_BUTTON_ARTWORK_CLEARANCE = 0.00012;
const FRONT_BUTTON_BODY_DEPTH = 0.0042;
const FRONT_BUTTON_BEVEL_SIZE = 0.00055;
const REAR_PANEL_OUTER_Z = -0.30563357 - 0.00015;

const REAR_IO_CANVAS = {
  width: 2048,
  height: 512,
  portCenters: [300, 850, 1335, 1750],
  portY: 208,
  labelY: 398,
} as const;

// World-space height of the molded base/fabric seam after model normalization.
// The narrow blend removes atlas spill while retaining a natural soft join.
const BASE_TRIM_BLEND = {
  lowerY: -0.229,
  upperY: -0.215,
} as const;

// Native X positions of the seven decorative circles baked into this GLB.
const LEGACY_REAR_CIRCLE_CENTERS = [
  -0.272,
  -0.1834,
  -0.0994,
  0.0004,
  0.0992,
  0.1839,
  0.272,
] as const;

const LEGACY_REAR_STRAY_CONTROL = {
  centerX: -0.1093,
  centerY: 0.2571,
  radiusX: 0.024,
  radiusY: 0.03,
} as const;

interface GeometryComponentBounds {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  triangleCount: number;
}

/**
 * The generated main body contains hundreds of disconnected decorative mesh
 * islands. The old rear controls and front display are among those islands,
 * so hiding named GLTF nodes or repainting the texture cannot remove them.
 *
 * Keep the large, continuous curved body untouched and discard small
 * disconnected components inside the two measured rear-only regions. A few
 * circle fragments are welded to the main shell, so their seven tiny circular
 * footprints are clipped separately and filled from behind later.
 */
function removeLegacyGeneratedGeometry(geometry: THREE.BufferGeometry): void {
  if (geometry.userData.legacyGeneratedGeometryRemovedV2) return;

  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  if (!position || !index || index.count % 3 !== 0) return;

  const parent = new Int32Array(position.count);
  const rank = new Uint8Array(position.count);
  for (let i = 0; i < parent.length; i += 1) parent[i] = i;

  const findRoot = (vertex: number): number => {
    let root = vertex;
    while (parent[root] !== root) root = parent[root]!;

    let current = vertex;
    while (parent[current] !== current) {
      const next = parent[current]!;
      parent[current] = root;
      current = next;
    }
    return root;
  };

  const join = (a: number, b: number): void => {
    let rootA = findRoot(a);
    let rootB = findRoot(b);
    if (rootA === rootB) return;

    if (rank[rootA]! < rank[rootB]!) [rootA, rootB] = [rootB, rootA];
    parent[rootB] = rootA;
    if (rank[rootA] === rank[rootB]) rank[rootA] = rank[rootA]! + 1;
  };

  const sourceIndex = index.array;
  for (let i = 0; i < index.count; i += 3) {
    const a = Number(sourceIndex[i]);
    const b = Number(sourceIndex[i + 1]);
    const c = Number(sourceIndex[i + 2]);
    join(a, b);
    join(b, c);
  }

  const components = new Map<number, GeometryComponentBounds>();
  for (let i = 0; i < index.count; i += 3) {
    const a = Number(sourceIndex[i]);
    const b = Number(sourceIndex[i + 1]);
    const c = Number(sourceIndex[i + 2]);
    const root = findRoot(a);
    let bounds = components.get(root);

    if (!bounds) {
      bounds = {
        minX: Infinity,
        minY: Infinity,
        minZ: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
        maxZ: -Infinity,
        triangleCount: 0,
      };
      components.set(root, bounds);
    }

    for (const vertex of [a, b, c]) {
      const x = position.getX(vertex);
      const y = position.getY(vertex);
      const z = position.getZ(vertex);
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.minZ = Math.min(bounds.minZ, z);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
      bounds.maxZ = Math.max(bounds.maxZ, z);
    }
    bounds.triangleCount += 1;
  }

  const removableRoots = new Set<number>();
  components.forEach((bounds, root) => {
    // Native (pre-normalization) coordinates measured from this supplied GLB.
    const isOnRearSurface = bounds.maxZ < -0.275;
    const isOldDisplayOrPanel =
      isOnRearSurface &&
      bounds.minX > -0.22 &&
      bounds.maxX < 0.22 &&
      bounds.minY > 0.255 &&
      bounds.maxY < 0.39 &&
      bounds.triangleCount < 1500;
    const isOldCircleRow =
      isOnRearSurface &&
      bounds.minX > -0.42 &&
      bounds.maxX < 0.42 &&
      bounds.minY > 0.095 &&
      bounds.maxY < 0.16 &&
      bounds.triangleCount < 500;
    const isOldFrontDisplay =
      bounds.minZ > 0.27 &&
      bounds.minX > -0.3 &&
      bounds.maxX < 0.3 &&
      bounds.minY > 0.17 &&
      bounds.maxY < 0.4 &&
      bounds.triangleCount < 1500;

    if (isOldDisplayOrPanel || isOldCircleRow || isOldFrontDisplay) {
      removableRoots.add(root);
    }
  });

  const keptIndices: number[] = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = Number(sourceIndex[i]);
    const b = Number(sourceIndex[i + 1]);
    const c = Number(sourceIndex[i + 2]);
    if (removableRoots.has(findRoot(a))) continue;

    const centerX = (position.getX(a) + position.getX(b) + position.getX(c)) / 3;
    const centerY = (position.getY(a) + position.getY(b) + position.getY(c)) / 3;
    const centerZ = (position.getZ(a) + position.getZ(b) + position.getZ(c)) / 3;
    const isWeldedCircleFragment =
      centerZ < -0.27 &&
      centerY > 0.095 &&
      centerY < 0.16 &&
      LEGACY_REAR_CIRCLE_CENTERS.some((circleX) => {
        const dx = centerX - circleX;
        const dy = centerY - 0.127;
        return dx * dx + dy * dy < 0.021 * 0.021;
      });
    const strayControlX =
      (centerX - LEGACY_REAR_STRAY_CONTROL.centerX) /
      LEGACY_REAR_STRAY_CONTROL.radiusX;
    const strayControlY =
      (centerY - LEGACY_REAR_STRAY_CONTROL.centerY) /
      LEGACY_REAR_STRAY_CONTROL.radiusY;
    const isWeldedStrayControlFragment =
      centerZ < -0.27 &&
      strayControlX * strayControlX + strayControlY * strayControlY < 1;
    const weldedFootX =
      (centerX - LEGACY_WELDED_FRONT_RIGHT_FOOT.centerX) /
      LEGACY_WELDED_FRONT_RIGHT_FOOT.radiusX;
    const weldedFootZ =
      (centerZ - LEGACY_WELDED_FRONT_RIGHT_FOOT.centerZ) /
      LEGACY_WELDED_FRONT_RIGHT_FOOT.radiusZ;
    const isWeldedFrontRightFoot =
      centerY < LEGACY_WELDED_FRONT_RIGHT_FOOT.maxY &&
      weldedFootX * weldedFootX + weldedFootZ * weldedFootZ < 1;

    if (
      isWeldedCircleFragment ||
      isWeldedStrayControlFragment ||
      isWeldedFrontRightFoot
    ) {
      continue;
    }
    keptIndices.push(a, b, c);
  }

  if (keptIndices.length !== index.count) {
    const cleanIndex =
      position.count > 65535
        ? new Uint32Array(keptIndices)
        : new Uint16Array(keptIndices);
    geometry.setIndex(new THREE.BufferAttribute(cleanIndex, 1));
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  geometry.userData.legacyGeneratedGeometryRemovedV2 = true;
}

function createRoundedRectShape(
  width: number,
  height: number,
  radius: number,
  centerX = 0,
  centerY = 0
): THREE.Shape {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const safeRadius = Math.min(radius, halfWidth, halfHeight);
  const shape = new THREE.Shape();

  shape.moveTo(centerX - halfWidth + safeRadius, centerY - halfHeight);
  shape.lineTo(centerX + halfWidth - safeRadius, centerY - halfHeight);
  shape.quadraticCurveTo(
    centerX + halfWidth,
    centerY - halfHeight,
    centerX + halfWidth,
    centerY - halfHeight + safeRadius
  );
  shape.lineTo(centerX + halfWidth, centerY + halfHeight - safeRadius);
  shape.quadraticCurveTo(
    centerX + halfWidth,
    centerY + halfHeight,
    centerX + halfWidth - safeRadius,
    centerY + halfHeight
  );
  shape.lineTo(centerX - halfWidth + safeRadius, centerY + halfHeight);
  shape.quadraticCurveTo(
    centerX - halfWidth,
    centerY + halfHeight,
    centerX - halfWidth,
    centerY + halfHeight - safeRadius
  );
  shape.lineTo(centerX - halfWidth, centerY - halfHeight + safeRadius);
  shape.quadraticCurveTo(
    centerX - halfWidth,
    centerY - halfHeight,
    centerX - halfWidth + safeRadius,
    centerY - halfHeight
  );

  return shape;
}

function createRoundedRectGeometry(
  width: number,
  height: number,
  radius: number,
  curveSegments = 16
): THREE.ShapeGeometry {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const shape = createRoundedRectShape(width, height, radius);

  const geometry = new THREE.ShapeGeometry(shape, curveSegments);
  const positions = geometry.getAttribute("position");
  const uvs = new Float32Array(positions.count * 2);

  for (let i = 0; i < positions.count; i += 1) {
    uvs[i * 2] = (positions.getX(i) + halfWidth) / width;
    uvs[i * 2 + 1] = (positions.getY(i) + halfHeight) / height;
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

function createRoundedRectRingGeometry(
  outerWidth: number,
  outerHeight: number,
  outerRadius: number,
  innerWidth: number,
  innerHeight: number,
  innerRadius: number,
  curveSegments = 24
): THREE.ShapeGeometry {
  const ring = createRoundedRectShape(outerWidth, outerHeight, outerRadius);
  ring.holes.push(
    createRoundedRectShape(innerWidth, innerHeight, innerRadius)
  );
  const geometry = new THREE.ShapeGeometry(ring, curveSegments);
  geometry.computeVertexNormals();
  return geometry;
}

function createExtrudedEllipseGeometry(
  width: number,
  height: number,
  depth: number,
  bevelSize: number,
  bevelThickness: number,
  curveSegments = 48,
  bevelSegments = 4
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, width / 2, height / 2, 0, Math.PI * 2, false);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    curveSegments,
    steps: 1,
    depth,
    bevelEnabled: true,
    bevelSegments,
    bevelSize,
    bevelThickness,
  });
  geometry.computeVertexNormals();
  return geometry;
}

function createBottomFeetAssembly(profile: RenderProfile): THREE.Group {
  const assembly = new THREE.Group();
  assembly.name = "reference-matched-four-rubber-feet";

  const collarGeometry = new THREE.CylinderGeometry(
    BOTTOM_FOOT_LAYOUT.collarRadiusTop,
    BOTTOM_FOOT_LAYOUT.collarRadiusBottom,
    BOTTOM_FOOT_LAYOUT.collarHeight,
    profile.isMobile ? 32 : 64,
    profile.isMobile ? 2 : 3,
    false
  );
  const collarMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x111418,
    roughness: 0.58,
    metalness: 0.02,
    clearcoat: 0.16,
    clearcoatRoughness: 0.6,
  });

  const seamGeometry = new THREE.TorusGeometry(
    0.0246,
    0.0015,
    profile.isMobile ? 8 : 16,
    profile.isMobile ? 32 : 64
  );
  const seamMaterial = new THREE.MeshStandardMaterial({
    color: 0x090b0d,
    roughness: 0.72,
    metalness: 0,
  });

  const padGeometry = new THREE.SphereGeometry(
    BOTTOM_FOOT_LAYOUT.padRadius,
    profile.isMobile ? 32 : 64,
    profile.isMobile ? 16 : 32
  );
  const padMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xaeb4b8,
    roughness: 0.82,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.78,
  });

  BOTTOM_FOOT_LAYOUT.centers.forEach(([x, z], index) => {
    const foot = new THREE.Group();
    foot.name = `bottom-rubber-foot-${index + 1}`;
    foot.position.set(x, 0, z);

    const collar = new THREE.Mesh(collarGeometry, collarMaterial);
    collar.name = `bottom-foot-collar-${index + 1}`;
    collar.position.y = 0.021;
    collar.castShadow = true;
    collar.receiveShadow = true;
    foot.add(collar);

    const seam = new THREE.Mesh(seamGeometry, seamMaterial);
    seam.name = `bottom-foot-seam-${index + 1}`;
    seam.rotation.x = Math.PI / 2;
    seam.position.y = 0.0068;
    seam.castShadow = true;
    foot.add(seam);

    const pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.name = `bottom-foot-rubber-pad-${index + 1}`;
    pad.scale.y = 0.23;
    pad.position.y = 0.0043;
    pad.castShadow = true;
    pad.receiveShadow = true;
    foot.add(pad);

    assembly.add(foot);
  });

  return assembly;
}

function createTopChargingAssembly(profile: RenderProfile): THREE.Group {
  const assembly = new THREE.Group();
  assembly.name = "clean-top-charging-assembly";

  const measureInset = (inset: number) => ({
    width: TOP_SURFACE_MEASUREMENTS.width - inset * 2,
    depth: TOP_SURFACE_MEASUREMENTS.depth - inset * 2,
    radius: TOP_SURFACE_MEASUREMENTS.radius - inset,
  });
  const outerTrim = measureInset(0.003);
  const lightGuide = measureInset(0.014);
  const smoothPanel = measureInset(0.023);

  const addRoundedLayer = (
    name: string,
    width: number,
    depth: number,
    radius: number,
    y: number,
    material: THREE.Material
  ) => {
    const layer = new THREE.Mesh(
      createRoundedRectGeometry(
        width,
        depth,
        radius,
        profile.isMobile ? 10 : 16
      ),
      material
    );
    layer.name = name;
    layer.rotation.x = -Math.PI / 2;
    layer.position.y = y;
    layer.castShadow = false;
    layer.receiveShadow = true;
    assembly.add(layer);
  };

  // Three closely stacked, opaque layers completely cover the generated top
  // while recreating the real product's dark trim, pale inset rim, and smooth
  // molded centre panel.
  addRoundedLayer(
    "top-outer-trim",
    outerTrim.width,
    outerTrim.depth,
    outerTrim.radius,
    0.51,
    new THREE.MeshPhysicalMaterial({
      color: 0x171a1d,
      roughness: 0.22,
      metalness: 0.24,
      clearcoat: 0.9,
      clearcoatRoughness: 0.18,
      side: THREE.FrontSide,
    })
  );

  addRoundedLayer(
    "top-inset-light-guide",
    lightGuide.width,
    lightGuide.depth,
    lightGuide.radius,
    0.513,
    new THREE.MeshPhysicalMaterial({
      color: 0xa5afb6,
      roughness: 0.3,
      metalness: 0.08,
      clearcoat: 0.78,
      clearcoatRoughness: 0.2,
      side: THREE.FrontSide,
    })
  );

  addRoundedLayer(
    "top-smooth-panel",
    smoothPanel.width,
    smoothPanel.depth,
    smoothPanel.radius,
    0.516,
    new THREE.MeshPhysicalMaterial({
      color: 0x292e33,
      roughness: 0.34,
      metalness: 0.06,
      clearcoat: 0.62,
      clearcoatRoughness: 0.24,
      side: THREE.FrontSide,
    })
  );

  const padRingMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x444b52,
    roughness: 0.3,
    metalness: 0.12,
    clearcoat: 0.72,
    clearcoatRoughness: 0.2,
  });
  const padRing = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.135,
      0.135,
      0.01,
      profile.isMobile ? 48 : 96
    ),
    padRingMaterial
  );
  padRing.name = "wireless-pad-outer-ring";
  padRing.position.y = 0.522;
  padRing.castShadow = true;
  padRing.receiveShadow = false;
  assembly.add(padRing);

  const padDiscMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x252a2f,
    roughness: 0.38,
    metalness: 0.04,
    clearcoat: 0.52,
    clearcoatRoughness: 0.28,
  });
  const padDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.113,
      0.113,
      0.011,
      profile.isMobile ? 48 : 96
    ),
    padDiscMaterial
  );
  padDisc.name = "wireless-pad-raised-disc";
  padDisc.position.y = 0.528;
  padDisc.castShadow = true;
  padDisc.receiveShadow = false;
  assembly.add(padDisc);

  // A true 3D embossed mark stays sharp from every camera angle and avoids
  // the scratched, texture-generated symbol visible on the supplied model.
  const boltShape = new THREE.Shape();
  boltShape.moveTo(-0.006, 0.062);
  boltShape.lineTo(-0.03, -0.006);
  boltShape.lineTo(-0.006, -0.003);
  boltShape.lineTo(0.004, -0.062);
  boltShape.lineTo(0.03, 0.01);
  boltShape.lineTo(0.006, 0.007);
  boltShape.closePath();

  const boltGeometry = new THREE.ExtrudeGeometry(boltShape, {
    depth: 0.004,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.0014,
    bevelThickness: 0.0014,
    curveSegments: 1,
  });
  const bolt = new THREE.Mesh(
    boltGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0x080a0c,
      roughness: 0.2,
      metalness: 0.16,
      clearcoat: 0.7,
      clearcoatRoughness: 0.16,
    })
  );
  bolt.name = "wireless-pad-embossed-bolt";
  bolt.rotation.x = -Math.PI / 2;
  bolt.position.y = 0.534;
  bolt.castShadow = false;
  assembly.add(bolt);

  // Align to the exact centre of the original top mesh rather than the model
  // origin, keeping the visible rim even on all four sides.
  assembly.position.set(
    TOP_SURFACE_MEASUREMENTS.centerX,
    0,
    TOP_SURFACE_MEASUREMENTS.centerZ
  );

  return assembly;
}

function createCleanRearBodyTexture(
  sourceTexture: THREE.Texture,
  renderer: THREE.WebGLRenderer,
  textureKind: "baseColor" | "normal" | "materialData"
): THREE.CanvasTexture | null {
  const sourceImage = sourceTexture.image as
    | (CanvasImageSource & { width: number; height: number })
    | undefined;

  if (!sourceImage?.width || !sourceImage?.height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = sourceImage.width;
  canvas.height = sourceImage.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  // Coordinates are measured against the embedded 2048 x 2048 Tripo atlas.
  // Scaling keeps the cleanup correct if the source image is later resized.
  const sx = canvas.width / 2048;
  const sy = canvas.height / 2048;

  const ringX = 68 * sx;
  const ringY = 255 * sy;
  const ringWidth = 1027 * sx;
  const ringHeight = 95 * sy;

  // Repair only the rear strip. The base-colour version remains blue-biased
  // for the existing RGB shader; auxiliary maps receive neutral clean data.
  if (textureKind === "baseColor") {
    const ringGradient = ctx.createLinearGradient(0, ringY, 0, ringY + ringHeight);
    ringGradient.addColorStop(0, "#a8d8ff");
    ringGradient.addColorStop(0.45, "#79baff");
    ringGradient.addColorStop(1, "#4f91e8");
    ctx.fillStyle = ringGradient;
  } else if (textureKind === "normal") {
    ctx.fillStyle = "#8080ff";
  } else {
    const ringSample = ctx.getImageData(
      Math.round(200 * sx),
      Math.round(300 * sy),
      1,
      1
    ).data;
    ctx.fillStyle = `rgb(${ringSample[0]}, ${ringSample[1]}, ${ringSample[2]})`;
  }
  ctx.fillRect(ringX, ringY, ringWidth, ringHeight);

  const fabricX = 68 * sx;
  const fabricY = 352 * sy;
  const fabricWidth = 1027 * sx;
  const fabricHeight = 370 * sy;

  // Build a seamless mirrored tile from a clean piece of the model's real
  // fabric. Reusing the source atlas avoids the artificial carbon-fibre look.
  const sampleX = 120 * sx;
  const sampleY = 520 * sy;
  const sampleWidth = Math.max(1, Math.round(180 * sx));
  const sampleHeight = Math.max(1, Math.round(120 * sy));
  const fabricTile = document.createElement("canvas");
  fabricTile.width = sampleWidth * 2;
  fabricTile.height = sampleHeight * 2;
  const tileCtx = fabricTile.getContext("2d")!;

  const drawMirroredSample = (
    destinationX: number,
    destinationY: number,
    flipX: boolean,
    flipY: boolean
  ) => {
    tileCtx.save();
    tileCtx.translate(
      destinationX + (flipX ? sampleWidth : 0),
      destinationY + (flipY ? sampleHeight : 0)
    );
    tileCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    tileCtx.drawImage(
      canvas,
      sampleX,
      sampleY,
      180 * sx,
      120 * sy,
      0,
      0,
      sampleWidth,
      sampleHeight
    );
    tileCtx.restore();
  };

  drawMirroredSample(0, 0, false, false);
  drawMirroredSample(sampleWidth, 0, true, false);
  drawMirroredSample(0, sampleHeight, false, true);
  drawMirroredSample(sampleWidth, sampleHeight, true, true);

  // Repaint the rear atlas region itself instead of adding a flat mesh. This
  // preserves the original curved silhouette from every viewing angle.
  const fabricPattern = ctx.createPattern(fabricTile, "repeat");
  const fallbackColor =
    textureKind === "baseColor"
      ? "#303238"
      : textureKind === "normal"
        ? "#8080ff"
        : "#ff9800";
  ctx.fillStyle = fabricPattern ?? fallbackColor;
  ctx.fillRect(fabricX, fabricY, fabricWidth, fabricHeight);
  if (textureKind === "baseColor") {
    ctx.fillStyle = "rgba(12, 14, 18, 0.1)";
    ctx.fillRect(fabricX, fabricY, fabricWidth, fabricHeight);
  }

  // Erase the low-resolution front clock artwork in the atlas with fabric
  // sampled from the same front UV island. The crisp LED overlay is added as
  // separate geometry, so no rectangular display background or logo appears.
  const frontSampleWidth = Math.max(1, Math.round(96 * sx));
  const frontSampleHeight = Math.max(1, Math.round(96 * sy));
  const frontFabricTile = document.createElement("canvas");
  frontFabricTile.width = frontSampleWidth * 2;
  frontFabricTile.height = frontSampleHeight * 2;
  const frontTileCtx = frontFabricTile.getContext("2d")!;

  const drawFrontMirroredSample = (
    destinationX: number,
    destinationY: number,
    flipX: boolean,
    flipY: boolean
  ) => {
    frontTileCtx.save();
    frontTileCtx.translate(
      destinationX + (flipX ? frontSampleWidth : 0),
      destinationY + (flipY ? frontSampleHeight : 0)
    );
    frontTileCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    frontTileCtx.drawImage(
      canvas,
      340 * sx,
      1040 * sy,
      96 * sx,
      96 * sy,
      0,
      0,
      frontSampleWidth,
      frontSampleHeight
    );
    frontTileCtx.restore();
  };

  drawFrontMirroredSample(0, 0, false, false);
  drawFrontMirroredSample(frontSampleWidth, 0, true, false);
  drawFrontMirroredSample(0, frontSampleHeight, false, true);
  drawFrontMirroredSample(
    frontSampleWidth,
    frontSampleHeight,
    true,
    true
  );

  const frontDisplayX = 230 * sx;
  const frontDisplayY = 1115 * sy;
  const frontDisplayWidth = 270 * sx;
  const frontDisplayHeight = 660 * sy;
  const frontFabricPattern = ctx.createPattern(frontFabricTile, "repeat");
  ctx.fillStyle = frontFabricPattern ?? fallbackColor;
  ctx.fillRect(
    frontDisplayX,
    frontDisplayY,
    frontDisplayWidth,
    frontDisplayHeight
  );
  if (textureKind === "baseColor") {
    ctx.fillStyle = "rgba(12, 14, 18, 0.08)";
    ctx.fillRect(
      frontDisplayX,
      frontDisplayY,
      frontDisplayWidth,
      frontDisplayHeight
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = `${sourceTexture.name || "speaker-body"}-clean-surfaces`;
  texture.mapping = sourceTexture.mapping;
  texture.channel = sourceTexture.channel;
  texture.wrapS = sourceTexture.wrapS;
  texture.wrapT = sourceTexture.wrapT;
  texture.magFilter = sourceTexture.magFilter;
  texture.minFilter = sourceTexture.minFilter;
  texture.anisotropy = Math.min(
    getRenderProfile(renderer).anisotropy,
    renderer.capabilities.getMaxAnisotropy()
  );
  texture.colorSpace = sourceTexture.colorSpace;
  texture.flipY = sourceTexture.flipY;
  texture.premultiplyAlpha = sourceTexture.premultiplyAlpha;
  texture.unpackAlignment = sourceTexture.unpackAlignment;
  texture.offset.copy(sourceTexture.offset);
  texture.repeat.copy(sourceTexture.repeat);
  texture.center.copy(sourceTexture.center);
  texture.rotation = sourceTexture.rotation;
  texture.matrixAutoUpdate = sourceTexture.matrixAutoUpdate;
  texture.needsUpdate = true;
  return texture;
}

function createRearFabricPatchTexture(
  sourceTexture: THREE.Texture,
  renderer: THREE.WebGLRenderer
): THREE.CanvasTexture | null {
  const sourceImage = sourceTexture.image as
    | (CanvasImageSource & { width: number; height: number })
    | undefined;
  if (!sourceImage?.width || !sourceImage?.height) return null;

  const profile = getRenderProfile(renderer);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(128 * profile.textureScale);
  canvas.height = Math.round(128 * profile.textureScale);
  const ctx = canvas.getContext("2d")!;
  const sx = sourceImage.width / 2048;
  const sy = sourceImage.height / 2048;

  // A clean 64 px fabric sample keeps the weave at the same visual scale as
  // the surrounding atlas when mapped onto each small replacement disc.
  ctx.drawImage(
    sourceImage,
    120 * sx,
    520 * sy,
    64 * sx,
    64 * sy,
    0,
    0,
    canvas.width,
    canvas.height
  );
  ctx.fillStyle = "rgba(12, 14, 18, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = "clean-rear-fabric-patch";
  texture.colorSpace = sourceTexture.colorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(
    profile.anisotropy,
    renderer.capabilities.getMaxAnisotropy()
  );
  texture.needsUpdate = true;
  return texture;
}

function createFrontFabricBackingTexture(
  sourceTexture: THREE.Texture,
  renderer: THREE.WebGLRenderer
): THREE.CanvasTexture | null {
  const sourceImage = sourceTexture.image as
    | (CanvasImageSource & { width: number; height: number })
    | undefined;
  if (!sourceImage?.width || !sourceImage?.height) return null;

  const profile = getRenderProfile(renderer);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(1024 * profile.textureScale);
  canvas.height = Math.round(384 * profile.textureScale);
  const ctx = canvas.getContext("2d")!;
  const sx = sourceImage.width / 2048;
  const sy = sourceImage.height / 2048;
  const sampleWidth = Math.max(1, Math.round(96 * sx));
  const sampleHeight = Math.max(1, Math.round(96 * sy));
  const tile = document.createElement("canvas");
  tile.width = sampleWidth * 2;
  tile.height = sampleHeight * 2;
  const tileCtx = tile.getContext("2d")!;

  const drawMirroredSample = (
    destinationX: number,
    destinationY: number,
    flipX: boolean,
    flipY: boolean
  ) => {
    tileCtx.save();
    tileCtx.translate(
      destinationX + (flipX ? sampleWidth : 0),
      destinationY + (flipY ? sampleHeight : 0)
    );
    tileCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    tileCtx.drawImage(
      sourceImage,
      340 * sx,
      1040 * sy,
      96 * sx,
      96 * sy,
      0,
      0,
      sampleWidth,
      sampleHeight
    );
    tileCtx.restore();
  };

  drawMirroredSample(0, 0, false, false);
  drawMirroredSample(sampleWidth, 0, true, false);
  drawMirroredSample(0, sampleHeight, false, true);
  drawMirroredSample(sampleWidth, sampleHeight, true, true);

  const pattern = ctx.createPattern(tile, "repeat");
  ctx.fillStyle = pattern ?? "#24262b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(8, 10, 13, 0.13)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = "opaque-front-display-fabric";
  texture.colorSpace = sourceTexture.colorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(
    profile.anisotropy,
    renderer.capabilities.getMaxAnisotropy()
  );
  texture.needsUpdate = true;
  return texture;
}

function createFrontLedDisplayTexture(
  renderer: THREE.WebGLRenderer
): THREE.CanvasTexture {
  const profile = getRenderProfile(renderer);
  const textureScale = profile.textureScale;
  const logicalWidth = 2048;
  const logicalHeight = 720;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(logicalWidth * textureScale);
  canvas.height = Math.round(logicalHeight * textureScale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(textureScale, textureScale);

  type SegmentRect = { x: number; y: number; width: number; height: number };
  const segmentMap: Record<string, readonly number[]> = {
    "0": [0, 1, 2, 3, 4, 5],
    "1": [1, 2],
    "2": [0, 1, 6, 4, 3],
  };

  const fillSegment = (
    segment: SegmentRect,
    color: string,
    glow: number
  ) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(205, 232, 255, 0.85)";
    ctx.shadowBlur = glow;
    ctx.beginPath();
    ctx.roundRect(
      segment.x,
      segment.y,
      segment.width,
      segment.height,
      Math.min(segment.width, segment.height) / 2
    );
    ctx.fill();
    ctx.restore();
  };

  const drawDigit = (
    digit: string,
    x: number,
    y: number,
    width: number,
    height: number,
    thickness: number
  ) => {
    const verticalHeight = height / 2 - thickness * 1.15;
    const segments: SegmentRect[] = [
      { x: x + thickness, y, width: width - thickness * 2, height: thickness },
      {
        x: x + width - thickness,
        y: y + thickness * 0.65,
        width: thickness,
        height: verticalHeight,
      },
      {
        x: x + width - thickness,
        y: y + height / 2 + thickness * 0.5,
        width: thickness,
        height: verticalHeight,
      },
      {
        x: x + thickness,
        y: y + height - thickness,
        width: width - thickness * 2,
        height: thickness,
      },
      {
        x,
        y: y + height / 2 + thickness * 0.5,
        width: thickness,
        height: verticalHeight,
      },
      {
        x,
        y: y + thickness * 0.65,
        width: thickness,
        height: verticalHeight,
      },
      {
        x: x + thickness,
        y: y + height / 2 - thickness / 2,
        width: width - thickness * 2,
        height: thickness,
      },
    ];

    // Very faint inactive segments make the clock feel like real LED glass,
    // while the active segments remain bright and easy to read.
    segments.forEach((segment) => {
      fillSegment(segment, "rgba(170, 190, 205, 0.018)", 0);
    });
    (segmentMap[digit] ?? []).forEach((segmentIndex) => {
      fillSegment(segments[segmentIndex]!, "rgba(239, 247, 252, 0.98)", 18);
    });
  };

  const digitY = 90;
  const digitWidth = 220;
  const digitHeight = 390;
  const digitThickness = 30;
  drawDigit("1", 510, digitY, digitWidth, digitHeight, digitThickness);
  drawDigit("2", 760, digitY, digitWidth, digitHeight, digitThickness);
  drawDigit("0", 1090, digitY, digitWidth, digitHeight, digitThickness);
  drawDigit("0", 1340, digitY, digitWidth, digitHeight, digitThickness);

  ctx.save();
  ctx.fillStyle = "rgba(239, 247, 252, 0.98)";
  ctx.shadowColor = "rgba(205, 232, 255, 0.85)";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(1030, 226, 16, 0, Math.PI * 2);
  ctx.arc(1030, 366, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const drawLabel = (
    text: string,
    x: number,
    y: number,
    fontSize: number
  ) => {
    ctx.save();
    ctx.fillStyle = "rgba(232, 241, 247, 0.96)";
    ctx.shadowColor = "rgba(205, 232, 255, 0.65)";
    ctx.shadowBlur = 10;
    ctx.font = `700 ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  drawLabel("AM", 280, 190, 58);
  drawLabel("PM", 280, 390, 58);
  drawLabel("BT", 1770, 190, 58);
  drawLabel("NS", 1770, 390, 58);
  drawLabel("60", 650, 620, 52);
  drawLabel("30", 900, 620, 52);
  drawLabel("15", 1150, 620, 52);
  drawLabel("FM", 1400, 620, 52);

  // Small alarm-status icon; this is a functional display symbol, not a logo.
  ctx.save();
  ctx.strokeStyle = "rgba(232, 241, 247, 0.96)";
  ctx.fillStyle = "rgba(232, 241, 247, 0.96)";
  ctx.shadowColor = "rgba(205, 232, 255, 0.65)";
  ctx.shadowBlur = 10;
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(1640, 620, 32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1626, 620);
  ctx.lineTo(1640, 630);
  ctx.lineTo(1654, 607);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1607, 581);
  ctx.lineTo(1621, 571);
  ctx.moveTo(1659, 571);
  ctx.lineTo(1673, 581);
  ctx.stroke();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = "clear-front-led-display";
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(
    profile.anisotropy,
    renderer.capabilities.getMaxAnisotropy()
  );
  texture.needsUpdate = true;
  return texture;
}

const FRONT_BUTTON_OVERLAY_WIDTH = 0.68;
const FRONT_BUTTON_OVERLAY_HEIGHT = 0.078;

function createFrontButtonIconsTexture(
  renderer: THREE.WebGLRenderer
): THREE.CanvasTexture {
  const profile = getRenderProfile(renderer);
  const textureScale = profile.textureScale;
  const logicalWidth = 2048;
  const logicalHeight = 236;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(logicalWidth * textureScale);
  canvas.height = Math.round(logicalHeight * textureScale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(textureScale, textureScale);
  const centerY = logicalHeight / 2;
  const pixelsPerModelX = logicalWidth / FRONT_BUTTON_OVERLAY_WIDTH;
  const pixelsPerModelY = logicalHeight / FRONT_BUTTON_OVERLAY_HEIGHT;
  const toCanvasX = (modelX: number) =>
    ((modelX + FRONT_BUTTON_OVERLAY_WIDTH / 2) /
      FRONT_BUTTON_OVERLAY_WIDTH) *
    logicalWidth;

  const setIconStroke = (lineWidth = 6) => {
    ctx.strokeStyle = "rgba(247, 249, 250, 0.98)";
    ctx.fillStyle = "rgba(247, 249, 250, 0.98)";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(255, 255, 255, 0.28)";
    ctx.shadowBlur = 3;
  };

  const drawButtonFace = (
    centerX: number,
    radiusX: number,
    radiusY: number
  ) => {
    ctx.save();
    const faceGradient = ctx.createRadialGradient(
      centerX - radiusX * 0.33,
      centerY - radiusY * 0.39,
      Math.max(8, Math.min(radiusX, radiusY) * 0.14),
      centerX,
      centerY,
      Math.max(radiusX, radiusY)
    );
    faceGradient.addColorStop(0, "rgba(72, 77, 84, 0.99)");
    faceGradient.addColorStop(0.48, "rgba(43, 47, 53, 0.995)");
    faceGradient.addColorStop(1, "rgba(20, 22, 26, 1)");

    ctx.shadowColor = "rgba(0, 0, 0, 0.72)";
    ctx.shadowBlur = 3.5;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = faceGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";
    const borderWidth = Math.max(
      4.5,
      Math.min(radiusX, radiusY) * 0.076
    );
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = "rgba(226, 231, 235, 0.94)";
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY,
      Math.max(1, radiusX - borderWidth / 2),
      Math.max(1, radiusY - borderWidth / 2),
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.lineWidth = Math.max(1.5, Math.min(radiusX, radiusY) * 0.028);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.13)";
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY,
      Math.max(1, radiusX - 9),
      Math.max(1, radiusY - 9),
      0,
      Math.PI * 1.06,
      Math.PI * 1.94
    );
    ctx.stroke();
    ctx.restore();
  };

  const drawClock = () => {
    setIconStroke(5.5);
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 52, Math.sin(angle) * 52, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.lineTo(0, 0);
    ctx.lineTo(24, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawAlarm = () => {
    setIconStroke(6);
    ctx.beginPath();
    ctx.arc(0, 3, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -19);
    ctx.lineTo(0, 3);
    ctx.lineTo(17, -7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-31, -34);
    ctx.quadraticCurveTo(-44, -47, -53, -31);
    ctx.moveTo(31, -34);
    ctx.quadraticCurveTo(44, -47, 53, -31);
    ctx.moveTo(-25, 33);
    ctx.lineTo(-34, 45);
    ctx.moveTo(25, 33);
    ctx.lineTo(34, 45);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 3, 3.8, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPrevious = () => {
    setIconStroke(6);
    ctx.beginPath();
    ctx.moveTo(-40, -28);
    ctx.lineTo(-40, 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.lineTo(4, -28);
    ctx.lineTo(4, 28);
    ctx.closePath();
    ctx.moveTo(2, 0);
    ctx.lineTo(39, -28);
    ctx.lineTo(39, 28);
    ctx.closePath();
    ctx.fill();
  };

  const drawNext = () => {
    setIconStroke(6);
    ctx.beginPath();
    ctx.moveTo(40, -28);
    ctx.lineTo(40, 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(-4, -28);
    ctx.lineTo(-4, 28);
    ctx.closePath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(-39, -28);
    ctx.lineTo(-39, 28);
    ctx.closePath();
    ctx.fill();
  };

  const drawStopwatch = () => {
    setIconStroke(6);
    ctx.beginPath();
    ctx.arc(0, 6, 37, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, -38);
    ctx.lineTo(11, -38);
    ctx.moveTo(0, -38);
    ctx.lineTo(0, -47);
    ctx.moveTo(29, -24);
    ctx.lineTo(39, -34);
    ctx.moveTo(0, 6);
    ctx.lineTo(-18, -17);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 6, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawModePlayPause = () => {
    setIconStroke(5.5);
    ctx.shadowBlur = 2;
    ctx.font = "500 38px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("M", -24, -22);

    // Diagonal divider, matching the printed mode/track symbol.
    ctx.beginPath();
    ctx.moveTo(-32, 38);
    ctx.lineTo(30, -38);
    ctx.stroke();

    // Track/play mark in the lower-right quadrant: triangle + one bar.
    ctx.beginPath();
    ctx.moveTo(5, 12);
    ctx.lineTo(5, 39);
    ctx.lineTo(29, 25.5);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(36, 13);
    ctx.lineTo(36, 38);
    ctx.stroke();
  };

  const drawLightPower = () => {
    setIconStroke(5.5);

    // Solid bulb in the upper-left quadrant.
    ctx.beginPath();
    ctx.moveTo(-22, -42);
    ctx.bezierCurveTo(-35, -42, -42, -33, -40, -21);
    ctx.bezierCurveTo(-39, -13, -33, -9, -31, -2);
    ctx.lineTo(-13, -2);
    ctx.bezierCurveTo(-11, -9, -5, -13, -4, -21);
    ctx.bezierCurveTo(-2, -33, -9, -42, -22, -42);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-30, 1, 16, 7, 3);
    ctx.fill();

    // Small round light rays used by the physical button artwork.
    [
      [-43, -34],
      [-34, -45],
      [-22, -49],
      [-10, -45],
      [-1, -34],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Divider between the light and power functions.
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(-9, 39);
    ctx.lineTo(31, -39);
    ctx.stroke();

    // Standard power symbol in the lower-right quadrant.
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(26, 21, 22, -Math.PI * 0.25, Math.PI * 1.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(26, -9);
    ctx.lineTo(26, 20);
    ctx.stroke();
  };

  const iconDrawers = [
    drawClock,
    drawAlarm,
    drawPrevious,
    drawNext,
    drawStopwatch,
    drawModePlayPause,
    drawLightPower,
  ] as const;

  FRONT_BUTTON_FITS.forEach((fit, index) => {
    const centerX = toCanvasX(fit.centerX);
    const radiusX = (fit.width / 2) * pixelsPerModelX;
    const radiusY = (fit.height / 2) * pixelsPerModelY;
    const iconScale = Math.min(radiusX, radiusY) / 72;
    drawButtonFace(centerX, radiusX, radiusY);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(0.83 * iconScale, 0.83 * iconScale);
    iconDrawers[index]!();
    ctx.restore();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = "high-resolution-front-button-symbols";
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(
    profile.anisotropy,
    renderer.capabilities.getMaxAnisotropy()
  );
  texture.needsUpdate = true;
  return texture;
}

function createRearPortLabelsTexture(
  renderer: THREE.WebGLRenderer
): THREE.CanvasTexture {
  const profile = getRenderProfile(renderer);
  const textureScale = profile.textureScale;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(REAR_IO_CANVAS.width * textureScale);
  canvas.height = Math.round(REAR_IO_CANVAS.height * textureScale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(textureScale, textureScale);

  // The plate and ports are real geometry. This transparent layer contains
  // only the crisp functional labels visible in the product reference.
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 92px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DC5V", REAR_IO_CANVAS.portCenters[0], REAR_IO_CANVAS.labelY);
  ctx.fillText("TF", REAR_IO_CANVAS.portCenters[1], REAR_IO_CANVAS.labelY);
  ctx.fillText("USB", REAR_IO_CANVAS.portCenters[2], REAR_IO_CANVAS.labelY);
  ctx.fillText("AUX", REAR_IO_CANVAS.portCenters[3], REAR_IO_CANVAS.labelY);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(
    profile.anisotropy,
    renderer.capabilities.getMaxAnisotropy()
  );
  texture.needsUpdate = true;
  return texture;
}

function createRearPortAssembly(
  renderer: THREE.WebGLRenderer,
  panelWidth: number,
  panelHeight: number
): THREE.Group {
  const profile = getRenderProfile(renderer);
  const shapeSegments = profile.isMobile ? 12 : 24;
  const assembly = new THREE.Group();
  assembly.name = "clean-rear-io-assembly";

  const canvasWidth = REAR_IO_CANVAS.width;
  const canvasHeight = REAR_IO_CANVAS.height;
  const toPanelX = (canvasX: number) =>
    (canvasX / canvasWidth - 0.5) * panelWidth;
  const toPanelY = (canvasY: number) =>
    (0.5 - canvasY / canvasHeight) * panelHeight;
  const scaleWidth = (pixels: number) => (pixels / canvasWidth) * panelWidth;
  const scaleHeight = (pixels: number) => (pixels / canvasHeight) * panelHeight;

  const usbCX = toPanelX(REAR_IO_CANVAS.portCenters[0]);
  const tfX = toPanelX(REAR_IO_CANVAS.portCenters[1]);
  const usbAX = toPanelX(REAR_IO_CANVAS.portCenters[2]);
  const auxX = toPanelX(REAR_IO_CANVAS.portCenters[3]);
  const portCenterY = toPanelY(REAR_IO_CANVAS.portY);

  // Dimensions measured as proportions of the reference capsule. The larger
  // openings and adjusted spacing reproduce the real hardware hierarchy.
  const usbCOuterWidth = scaleWidth(300);
  const usbCOuterHeight = scaleHeight(118);
  const usbCInnerWidth = usbCOuterWidth * 0.78;
  const usbCInnerHeight = usbCOuterHeight * 0.58;
  const tfOuterWidth = scaleWidth(380);
  const tfOuterHeight = scaleHeight(88);
  const tfInnerWidth = tfOuterWidth * 0.88;
  const tfInnerHeight = tfOuterHeight * 0.44;
  const usbAOuterWidth = scaleWidth(410);
  const usbAOuterHeight = scaleHeight(218);
  const usbAInnerWidth = usbAOuterWidth * 0.82;
  const usbAInnerHeight = usbAOuterHeight * 0.72;
  const auxRadius = scaleHeight(92);
  const auxOpeningRadius = auxRadius * 0.58;

  const panelDepth = 0.0034;
  const bevelSize = 0.00145;
  const bevelThickness = 0.0009;
  const panelRadius = panelHeight / 2;
  const panelShape = createRoundedRectShape(
    panelWidth,
    panelHeight,
    panelRadius
  );

  // True openings expose dark cavities behind the face. This gives the metal
  // rims and sockets real parallax at oblique camera angles.
  panelShape.holes.push(
    createRoundedRectShape(
      usbCInnerWidth,
      usbCInnerHeight,
      usbCInnerHeight / 2,
      usbCX,
      portCenterY
    ),
    createRoundedRectShape(
      tfInnerWidth,
      tfInnerHeight,
      tfInnerHeight * 0.34,
      tfX,
      portCenterY
    ),
    createRoundedRectShape(
      usbAInnerWidth,
      usbAInnerHeight,
      0.0018,
      usbAX,
      portCenterY
    )
  );
  const auxHole = new THREE.Path();
  auxHole.absarc(
    auxX,
    portCenterY,
    auxOpeningRadius,
    0,
    Math.PI * 2,
    false
  );
  panelShape.holes.push(auxHole);

  const panelGeometry = new THREE.ExtrudeGeometry(panelShape, {
    curveSegments: profile.isMobile ? 18 : 32,
    steps: 1,
    depth: panelDepth,
    bevelEnabled: true,
    bevelSegments: profile.isMobile ? 3 : 5,
    bevelSize,
    bevelThickness,
  });
  panelGeometry.computeVertexNormals();
  panelGeometry.computeBoundingBox();
  const panelFaceZ = panelGeometry.boundingBox?.max.z ?? panelDepth;
  const cavityBackZ = 0.00018;

  const panelBody = new THREE.Mesh(
    panelGeometry,
    new THREE.MeshPhysicalMaterial({
      color: 0x42464b,
      roughness: 0.64,
      metalness: 0.06,
      clearcoat: 0.18,
      clearcoatRoughness: 0.62,
    })
  );
  panelBody.name = "rear-io-molded-capsule";
  panelBody.castShadow = true;
  panelBody.receiveShadow = true;
  assembly.add(panelBody);

  const labelOverlay = new THREE.Mesh(
    createRoundedRectGeometry(
      panelWidth - 0.003,
      panelHeight - 0.003,
      (panelHeight - 0.003) / 2,
      shapeSegments
    ),
    new THREE.MeshBasicMaterial({
      map: createRearPortLabelsTexture(renderer),
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false,
      toneMapped: false,
      side: THREE.FrontSide,
    })
  );
  labelOverlay.name = "rear-io-crisp-labels";
  labelOverlay.position.z = panelFaceZ + 0.00018;
  labelOverlay.renderOrder = 10;
  assembly.add(labelOverlay);

  const metalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb7bdc3,
    roughness: 0.24,
    metalness: 0.86,
    clearcoat: 0.34,
    clearcoatRoughness: 0.24,
    side: THREE.FrontSide,
  });
  const darkMetalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x676c72,
    roughness: 0.34,
    metalness: 0.7,
    side: THREE.FrontSide,
  });
  const cavityMaterial = new THREE.MeshStandardMaterial({
    color: 0x050607,
    roughness: 0.72,
    metalness: 0.08,
    side: THREE.FrontSide,
  });
  const graphiteMaterial = new THREE.MeshStandardMaterial({
    color: 0x22262b,
    roughness: 0.55,
    metalness: 0.16,
    side: THREE.FrontSide,
  });
  const blueInsertMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c5d91,
    roughness: 0.42,
    metalness: 0.12,
    side: THREE.FrontSide,
  });
  const contactMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc9a96b,
    roughness: 0.3,
    metalness: 0.78,
    side: THREE.FrontSide,
  });

  const addRoundedPortLayer = (
    name: string,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    radius: number,
    z: number,
    material: THREE.Material
  ) => {
    const layer = new THREE.Mesh(
      createRoundedRectGeometry(width, height, radius, shapeSegments),
      material
    );
    layer.name = name;
    layer.position.set(centerX, centerY, z);
    layer.receiveShadow = true;
    layer.renderOrder = 7;
    assembly.add(layer);
    return layer;
  };

  const addRoundedPortRing = (
    name: string,
    centerX: number,
    centerY: number,
    outerWidth: number,
    outerHeight: number,
    outerRadius: number,
    innerWidth: number,
    innerHeight: number,
    innerRadius: number,
    material: THREE.Material
  ) => {
    const ring = new THREE.Mesh(
      createRoundedRectRingGeometry(
        outerWidth,
        outerHeight,
        outerRadius,
        innerWidth,
        innerHeight,
        innerRadius,
        shapeSegments
      ),
      material
    );
    ring.name = name;
    ring.position.set(centerX, centerY, panelFaceZ + 0.0002);
    ring.castShadow = true;
    ring.renderOrder = 8;
    assembly.add(ring);
    return ring;
  };

  // USB-C / DC5V: real cutout, brushed-metal rim, and recessed centre tongue.
  addRoundedPortLayer(
    "rear-usbc-cavity",
    usbCX,
    portCenterY,
    usbCInnerWidth * 0.99,
    usbCInnerHeight * 0.98,
    usbCInnerHeight / 2,
    cavityBackZ,
    cavityMaterial
  );
  addRoundedPortRing(
    "rear-usbc-metal-rim",
    usbCX,
    portCenterY,
    usbCOuterWidth,
    usbCOuterHeight,
    usbCOuterHeight / 2,
    usbCInnerWidth,
    usbCInnerHeight,
    usbCInnerHeight / 2,
    metalMaterial
  );
  addRoundedPortLayer(
    "rear-usbc-tongue",
    usbCX,
    portCenterY,
    usbCInnerWidth * 0.7,
    Math.max(usbCInnerHeight * 0.17, 0.0015),
    0.00075,
    cavityBackZ + 0.00036,
    graphiteMaterial
  );

  // TF / microSD: deep narrow slot with a slim metallic molded lip.
  addRoundedPortLayer(
    "rear-tf-cavity",
    tfX,
    portCenterY,
    tfInnerWidth * 0.99,
    tfInnerHeight * 0.98,
    tfInnerHeight * 0.32,
    cavityBackZ,
    cavityMaterial
  );
  addRoundedPortRing(
    "rear-tf-metal-lip",
    tfX,
    portCenterY,
    tfOuterWidth,
    tfOuterHeight,
    tfOuterHeight * 0.28,
    tfInnerWidth,
    tfInnerHeight,
    tfInnerHeight * 0.32,
    darkMetalMaterial
  );
  addRoundedPortLayer(
    "rear-tf-contact",
    tfX,
    portCenterY - tfInnerHeight * 0.2,
    tfInnerWidth * 0.72,
    Math.max(tfInnerHeight * 0.12, 0.0008),
    0.0005,
    cavityBackZ + 0.00034,
    contactMaterial
  );

  // USB-A: thick rectangular shell, deep cavity, blue tongue, and four pins.
  addRoundedPortLayer(
    "rear-usba-cavity",
    usbAX,
    portCenterY,
    usbAInnerWidth * 0.99,
    usbAInnerHeight * 0.99,
    0.0014,
    cavityBackZ,
    cavityMaterial
  );
  addRoundedPortRing(
    "rear-usba-metal-shell",
    usbAX,
    portCenterY,
    usbAOuterWidth,
    usbAOuterHeight,
    0.0024,
    usbAInnerWidth,
    usbAInnerHeight,
    0.0014,
    metalMaterial
  );
  addRoundedPortLayer(
    "rear-usba-blue-insert",
    usbAX,
    portCenterY + usbAInnerHeight * 0.18,
    usbAInnerWidth * 0.92,
    usbAInnerHeight * 0.34,
    0.0008,
    cavityBackZ + 0.0003,
    blueInsertMaterial
  );
  for (let index = 0; index < 4; index += 1) {
    addRoundedPortLayer(
      `rear-usba-contact-${index + 1}`,
      usbAX + usbAInnerWidth * (-0.3 + index * 0.2),
      portCenterY + usbAInnerHeight * 0.18,
      usbAInnerWidth * 0.055,
      usbAInnerHeight * 0.12,
      0.00035,
      cavityBackZ + 0.00048,
      contactMaterial
    );
  }

  // AUX: wide metallic socket rim surrounding a genuinely recessed opening.
  const auxRing = new THREE.Mesh(
    new THREE.RingGeometry(
      auxOpeningRadius,
      auxRadius,
      profile.isMobile ? 32 : 64
    ),
    metalMaterial
  );
  auxRing.name = "rear-aux-metal-ring";
  auxRing.position.set(auxX, portCenterY, panelFaceZ + 0.0002);
  auxRing.castShadow = true;
  auxRing.renderOrder = 8;
  assembly.add(auxRing);

  const auxOpening = new THREE.Mesh(
    new THREE.CircleGeometry(
      auxOpeningRadius * 0.99,
      profile.isMobile ? 32 : 64
    ),
    cavityMaterial
  );
  auxOpening.name = "rear-aux-deep-opening";
  auxOpening.position.set(auxX, portCenterY, cavityBackZ);
  auxOpening.renderOrder = 6;
  assembly.add(auxOpening);

  const auxInner = new THREE.Mesh(
    new THREE.CircleGeometry(
      auxOpeningRadius * 0.26,
      profile.isMobile ? 24 : 48
    ),
    graphiteMaterial
  );
  auxInner.name = "rear-aux-inner-contact";
  auxInner.position.set(auxX, portCenterY, cavityBackZ + 0.00034);
  auxInner.renderOrder = 7;
  assembly.add(auxInner);

  return assembly;
}

export function ModelViewer3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(() =>
    typeof window === "undefined"
      ? true
      : !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [selectedRgb, setSelectedRgb] = useState<RgbColorOption>(RGB_COLOR_OPTIONS[0]!);
  const [showRoomBackdrop, setShowRoomBackdrop] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<string>("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Synchronous Ref for render loop & GPU shader uniforms
  const selectedRgbRef = useRef<RgbColorOption>(selectedRgb);

  const rgbUniforms = useRef({
    uRgbColor: { value: new THREE.Color(0x00f0ff) },
    uRgbWeight: { value: 1.0 },
    uRgbGlow: { value: 0.7 },
  });

  // Internal Three.js Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    dirLight1: THREE.DirectionalLight;
    dirLight2: THREE.DirectionalLight;
  } | null>(null);

  // Camera animation target
  const targetCamPos = useRef<THREE.Vector3 | null>(null);
  const targetLookPos = useRef<THREE.Vector3 | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderProfile = createRenderProfile();
    let disposed = false;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      renderProfile.isMobile ? 55 : 45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.copy(getResponsiveCameraPosition([0, 0.2, 2.2]));
    cameraRef.current = camera;

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: renderProfile.antialias,
        alpha: true,
        powerPreference: renderProfile.isLowPower ? "low-power" : "high-performance",
      });
    } catch (e) {
      console.warn("Failed to create WebGLRenderer:", e);
      setModelError("WebGL context could not be created.");
      setLoading(false);
      return;
    }
    RENDER_PROFILES.set(renderer, renderProfile);
    renderer.setPixelRatio(renderProfile.pixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = renderProfile.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.0;
    controls.maxDistance = 5.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controlsRef.current = controls;

    // Natural studio lighting for speaker body & clock
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight1.position.set(4, 6, 4);
    dirLight1.castShadow = renderProfile.shadows;
    if (renderProfile.shadows) {
      dirLight1.shadow.mapSize.set(1024, 1024);
    }
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight2.position.set(-4, 3, -4);
    scene.add(dirLight2);

    lightsRef.current = { ambient, dirLight1, dirLight2 };

    // Ground Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.55;
    shadowPlane.receiveShadow = renderProfile.shadows;
    shadowPlane.visible = renderProfile.shadows;
    scene.add(shadowPlane);
    if (!renderProfile.shadows) {
      scene.add(createLightweightContactShadow(renderProfile));
    }

    // GLTF Model Loader
    const loader = new GLTFLoader();
    const modelUrl = renderProfile.modelUrl;

    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) {
          disposeObjectResources(gltf.scene);
          return;
        }
        const root = gltf.scene;
        const productGroup = new THREE.Group();
        productGroup.name = "speaker-product";

        // Auto-center and normalize scale
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.4 / maxDim;

        root.scale.setScalar(scale);
        root.position.x = -center.x * scale;
        root.position.y = -center.y * scale;
        root.position.z = -center.z * scale;
        productGroup.add(root);

        let rearFabricPatchTexture: THREE.CanvasTexture | null = null;
        let frontFabricBackingTexture: THREE.CanvasTexture | null = null;
        const hiddenLegacyNodes: THREE.Object3D[] = [];
        const replacedSourceTextures = new Set<THREE.Texture>();

        // Enable shadows & hook 360° GPU ring shader
        root.traverse((node) => {
          if (
            LEGACY_REAR_PART_NAMES.has(node.name) ||
            LEGACY_FRONT_DISPLAY_PART_NAMES.has(node.name) ||
            LEGACY_TOP_PART_NAMES.has(node.name) ||
            LEGACY_FOOT_PART_NAMES.has(node.name)
          ) {
            hiddenLegacyNodes.push(node);
            return;
          }

          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            mesh.castShadow = renderProfile.shadows;
            mesh.receiveShadow = renderProfile.shadows;

            if (node.name === "tripo_part_0") {
              removeLegacyGeneratedGeometry(mesh.geometry);
            }

            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              const repairBodyBaseTrim = node.name === "tripo_part_0";
              mat.roughness = Math.max(mat.roughness ?? 0.4, 0.25);
              mat.metalness = Math.min(mat.metalness ?? 0.2, 0.8);

              if (node.name === "tripo_part_0") {
                if (mat.map) {
                  const originalMap = mat.map;
                  rearFabricPatchTexture ??= createRearFabricPatchTexture(
                    originalMap,
                    renderer
                  );
                  frontFabricBackingTexture ??= createFrontFabricBackingTexture(
                    originalMap,
                    renderer
                  );
                  const cleanRearTexture = createCleanRearBodyTexture(
                    originalMap,
                    renderer,
                    "baseColor"
                  );
                  if (cleanRearTexture) {
                    mat.map = cleanRearTexture;
                    replacedSourceTextures.add(originalMap);
                  }
                }

                if (mat.normalMap) {
                  const originalNormalMap = mat.normalMap;
                  const cleanRearNormal = createCleanRearBodyTexture(
                    originalNormalMap,
                    renderer,
                    "normal"
                  );
                  if (cleanRearNormal) {
                    mat.normalMap = cleanRearNormal;
                    replacedSourceTextures.add(originalNormalMap);
                  }
                }

                const originalRoughnessMap = mat.roughnessMap;
                if (originalRoughnessMap) {
                  const cleanRearMaterialData = createCleanRearBodyTexture(
                    originalRoughnessMap,
                    renderer,
                    "materialData"
                  );
                  if (cleanRearMaterialData) {
                    mat.roughnessMap = cleanRearMaterialData;
                    if (mat.metalnessMap === originalRoughnessMap) {
                      mat.metalnessMap = cleanRearMaterialData;
                    }
                    replacedSourceTextures.add(originalRoughnessMap);
                  }
                }
              }

              // Only the main shell contains the RGB strip. Keeping this
              // shader off the seven small hardware materials saves fragment
              // work on low-end GPUs without changing the ring.
              if (repairBodyBaseTrim) {
                mat.onBeforeCompile = (shader) => {
                shader.uniforms.uRgbColor = rgbUniforms.current.uRgbColor;
                shader.uniforms.uRgbWeight = rgbUniforms.current.uRgbWeight;
                shader.uniforms.uRgbGlow = rgbUniforms.current.uRgbGlow;

                // Pass world position from vertex shader
                shader.vertexShader =
                  `
                  varying vec3 vCustomWorldPos;
                ` + shader.vertexShader;

                shader.vertexShader = shader.vertexShader.replace(
                  "#include <begin_vertex>",
                  `#include <begin_vertex>
                  vCustomWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
                );

                // Uniform and varying declarations in fragment shader
                shader.fragmentShader =
                  `
                  varying vec3 vCustomWorldPos;
                  uniform vec3 uRgbColor;
                  uniform float uRgbWeight;
                  uniform float uRgbGlow;
                ` + shader.fragmentShader;

                // Replace diffuse color of the entire 360° ring
                shader.fragmentShader = shader.fragmentShader.replace(
                  "#include <map_fragment>",
                  `#include <map_fragment>
                  #ifdef USE_MAP
                    ${
                      repairBodyBaseTrim
                        ? `// Keep the fabric atlas strictly above the molded base seam.
                    float cleanBaseTrimMask = 1.0 - smoothstep(
                      ${BASE_TRIM_BLEND.lowerY.toFixed(3)},
                      ${BASE_TRIM_BLEND.upperY.toFixed(3)},
                      vCustomWorldPos.y
                    );
                    float cleanBaseTrimHeight = smoothstep(-0.355, ${BASE_TRIM_BLEND.upperY.toFixed(3)}, vCustomWorldPos.y);
                    vec3 cleanBaseTrimColor = mix(
                      vec3(0.085, 0.090, 0.100),
                      vec3(0.135, 0.140, 0.150),
                      cleanBaseTrimHeight
                    );
                    diffuseColor.rgb = mix(
                      diffuseColor.rgb,
                      cleanBaseTrimColor,
                      cleanBaseTrimMask
                    );`
                        : ""
                    }
                    float maxC = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
                    float minC = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
                    float sat = maxC - minC;
                    float blueDiff = diffuseColor.b - max(diffuseColor.r * 1.05, diffuseColor.g * 0.7);

                    // Tight height band constraining ALL detection to the ring strip only
                    float inHeightBand = smoothstep(0.08, 0.14, vCustomWorldPos.y) * (1.0 - smoothstep(0.28, 0.33, vCustomWorldPos.y));

                    // Filter out pure white clock digits and dark body panels
                    float isClockDigit = step(0.72, minC) * (1.0 - smoothstep(0.08, 0.22, sat));
                    float isDarkBody = 1.0 - smoothstep(0.06, 0.14, maxC);

                    // The generated atlas contains a few neutral gray damaged
                    // pixels inside the light strip. Color detection alone
                    // misses them, so also use the strip's measured 3D height.
                    // This repairs the full 360-degree surface without adding
                    // a patch mesh or changing the speaker's curved silhouette.
                    float geometricRingCore =
                      smoothstep(0.220, 0.234, vCustomWorldPos.y) *
                      (1.0 - smoothstep(0.329, 0.339, vCustomWorldPos.y));

                    // ALL detection paths are gated by height band — nothing bleeds below
                    float isBlueColor = inHeightBand * smoothstep(0.04, 0.12, blueDiff) * (1.0 - isClockDigit) * (1.0 - isDarkBody);
                    float isSaturatedInRing = inHeightBand * smoothstep(0.06, 0.15, sat) * (1.0 - isClockDigit) * (1.0 - isDarkBody);

                    float isRing = clamp(max(
                      geometricRingCore,
                      max(isBlueColor, isSaturatedInRing)
                    ), 0.0, 1.0);

                    if (isRing > 0.0) {
                      float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
                      float sampledBrightness = clamp(lum * 1.8 + 0.2, 0.3, 1.5);
                      float repairedBrightness = mix(
                        sampledBrightness,
                        1.15,
                        geometricRingCore
                      );
                      vec3 newRingColor = uRgbColor * repairedBrightness;
                      diffuseColor.rgb = mix(diffuseColor.rgb, newRingColor, isRing * uRgbWeight);
                    }
                  #endif`
                );

                if (repairBodyBaseTrim) {
                  // The atlas spill also affects the normal/roughness channels.
                  // Restore the molded base's smooth geometry below the seam.
                  shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <normal_fragment_begin>",
                    `#include <normal_fragment_begin>
                    vec3 cleanBaseGeometryNormal = normal;`
                  );
                  shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <normal_fragment_maps>",
                    `#include <normal_fragment_maps>
                    float cleanBaseNormalMask = 1.0 - smoothstep(
                      ${BASE_TRIM_BLEND.lowerY.toFixed(3)},
                      ${BASE_TRIM_BLEND.upperY.toFixed(3)},
                      vCustomWorldPos.y
                    );
                    normal = normalize(mix(
                      normal,
                      cleanBaseGeometryNormal,
                      cleanBaseNormalMask
                    ));`
                  );
                  shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <roughnessmap_fragment>",
                    `#include <roughnessmap_fragment>
                    roughnessFactor = mix(
                      roughnessFactor,
                      0.62,
                      1.0 - smoothstep(
                        ${BASE_TRIM_BLEND.lowerY.toFixed(3)},
                        ${BASE_TRIM_BLEND.upperY.toFixed(3)},
                        vCustomWorldPos.y
                      )
                    );`
                  );
                }

                // Add emissive glow strictly within the ring height band
                shader.fragmentShader = shader.fragmentShader.replace(
                  "#include <emissivemap_fragment>",
                  `#include <emissivemap_fragment>
                  #ifdef USE_MAP
                    float maxCEm = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
                    float minCEm = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
                    float satEm = maxCEm - minCEm;
                    float blueDiffEm = diffuseColor.b - max(diffuseColor.r * 1.05, diffuseColor.g * 0.7);
                    float inHeightBandEm = smoothstep(0.08, 0.14, vCustomWorldPos.y) * (1.0 - smoothstep(0.28, 0.33, vCustomWorldPos.y));
                    float isClockDigitEm = step(0.72, minCEm) * (1.0 - smoothstep(0.08, 0.22, satEm));
                    float isDarkBodyEm = 1.0 - smoothstep(0.06, 0.14, maxCEm);
                    float geometricRingCoreEm =
                      smoothstep(0.220, 0.234, vCustomWorldPos.y) *
                      (1.0 - smoothstep(0.329, 0.339, vCustomWorldPos.y));

                    float isRingEm = clamp(max(
                      geometricRingCoreEm,
                      max(
                        inHeightBandEm * smoothstep(0.04, 0.12, blueDiffEm) * (1.0 - isClockDigitEm) * (1.0 - isDarkBodyEm),
                        inHeightBandEm * smoothstep(0.06, 0.15, satEm) * (1.0 - isClockDigitEm) * (1.0 - isDarkBodyEm)
                      )
                    ), 0.0, 1.0);

                    if (isRingEm > 0.0) {
                      totalEmissiveRadiance += uRgbColor * (isRingEm * uRgbGlow);
                    }
                  #endif`
                );
                };
              }

              mat.needsUpdate = true;
            }
          }
        });

        hiddenLegacyNodes.forEach((node) => {
          node.removeFromParent();
          disposeObjectResources(node);
        });
        replacedSourceTextures.forEach((texture) => texture.dispose());

        // Replace the full generated top surface in one opaque assembly. This
        // hides its carbon pattern, scratches, broken circular outline, and old
        // lightning mark while leaving the speaker body and RGB side band intact.
        root.add(createTopChargingAssembly(renderProfile));

        // Replace only the four malformed generated feet. The new symmetric
        // collars and inset gray rubber pads match the supplied underside photo
        // and intersect the molded base so no foot appears to float.
        root.add(createBottomFeetAssembly(renderProfile));

        // The old circles leave small openings after their welded fragments are
        // clipped. Fill those openings just behind the shell with the model's
        // own fabric; because these discs sit inside, no cover board is visible.
        if (rearFabricPatchTexture) {
          const circlePatchGeometry = new THREE.CircleGeometry(
            0.024,
            renderProfile.isMobile ? 24 : 40
          );
          const circlePatchMaterial = new THREE.MeshStandardMaterial({
            map: rearFabricPatchTexture,
            roughness: 0.96,
            metalness: 0,
            side: THREE.FrontSide,
          });

          LEGACY_REAR_CIRCLE_CENTERS.forEach((circleX, index) => {
            const horizontalRatio = Math.abs(circleX) / 0.272;
            const rearDepth = -0.2985 - 0.008 * horizontalRatio * horizontalRatio;
            const circlePatch = new THREE.Mesh(
              circlePatchGeometry,
              circlePatchMaterial
            );
            circlePatch.name = `clean-rear-fabric-patch-${index + 1}`;
            circlePatch.position.set(circleX, 0.127, rearDepth);
            circlePatch.rotation.y = Math.PI;
            circlePatch.receiveShadow = true;
            circlePatch.renderOrder = 1;
            root.add(circlePatch);
          });

          // A final small ring from the old hanging control is welded into the
          // shell below the right side of the new panel. Clip it above and fill
          // its opening with one slightly oval inset fabric patch.
          const strayControlPatch = new THREE.Mesh(
            circlePatchGeometry,
            circlePatchMaterial
          );
          strayControlPatch.name = "clean-rear-stray-control-patch";
          strayControlPatch.position.set(
            LEGACY_REAR_STRAY_CONTROL.centerX,
            LEGACY_REAR_STRAY_CONTROL.centerY,
            -0.2965
          );
          strayControlPatch.scale.set(
            0.026 / 0.024,
            0.031 / 0.024,
            1
          );
          strayControlPatch.rotation.y = Math.PI;
          strayControlPatch.receiveShadow = true;
          strayControlPatch.renderOrder = 1;
          root.add(strayControlPatch);
        }

        // Seal the complete front display opening from inside with an opaque
        // fabric-matched layer. It is behind the original grille, so it hides
        // internal/backsided geometry without becoming an exterior cover board.
        const frontBackingGeometry = new THREE.PlaneGeometry(0.6, 0.225);
        const frontBackingMaterial = new THREE.MeshStandardMaterial({
          color: frontFabricBackingTexture ? 0xffffff : 0x24262b,
          map: frontFabricBackingTexture,
          roughness: 0.96,
          metalness: 0,
          side: THREE.DoubleSide,
        });
        const frontBacking = new THREE.Mesh(
          frontBackingGeometry,
          frontBackingMaterial
        );
        frontBacking.name = "opaque-front-display-backing";
        frontBacking.position.set(-0.005, 0.285, 0.299);
        frontBacking.receiveShadow = true;
        frontBacking.renderOrder = 2;
        root.add(frontBacking);

        // High-resolution transparent LED layer placed over the sealed front
        // fabric. It contains only clock/status information—never branding.
        const frontDisplayTexture = createFrontLedDisplayTexture(renderer);
        const frontDisplayGeometry = new THREE.PlaneGeometry(0.56, 0.197);
        const frontDisplayMaterial = new THREE.MeshBasicMaterial({
          map: frontDisplayTexture,
          transparent: true,
          depthWrite: false,
          toneMapped: false,
          side: THREE.FrontSide,
          blending: THREE.NormalBlending,
        });
        const frontDisplay = new THREE.Mesh(
          frontDisplayGeometry,
          frontDisplayMaterial
        );
        frontDisplay.name = "clear-front-led-clock";
        frontDisplay.position.set(-0.005, 0.285, 0.31);
        frontDisplay.renderOrder = 4;
        root.add(frontDisplay);

        // Replace the fuzzy generated markings on the seven physical front
        // buttons with crisp functional symbols. Each face has its own measured
        // Z position, so no button must share a visibly floating flat plane.
        const frontButtonTexture = createFrontButtonIconsTexture(renderer);
        const frontButtonMaterial = new THREE.MeshBasicMaterial({
          map: frontButtonTexture,
          transparent: true,
          alphaTest: 0.015,
          depthWrite: true,
          toneMapped: false,
          side: THREE.FrontSide,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
        const frontButtonSideMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x1c2025,
          roughness: 0.38,
          metalness: 0.08,
          clearcoat: 0.42,
          clearcoatRoughness: 0.3,
        });

        FRONT_BUTTON_FITS.forEach((fit, index) => {
          // Extrusion bevels grow beyond the source shape, so subtract the
          // bevel once per side. The resulting visible silhouette lands on the
          // measured width, height, and radius of the original molded face.
          const buttonBevel = Math.min(
            FRONT_BUTTON_BEVEL_SIZE,
            fit.radius * 0.08
          );
          const geometry = createExtrudedEllipseGeometry(
            fit.width - buttonBevel * 2,
            fit.height - buttonBevel * 2,
            FRONT_BUTTON_BODY_DEPTH,
            buttonBevel,
            buttonBevel * 0.72,
            renderProfile.isMobile ? 24 : 48,
            renderProfile.isMobile ? 2 : 4
          );
          geometry.computeBoundingBox();

          const uv = geometry.getAttribute("uv");
          const uCenter =
            (fit.centerX + FRONT_BUTTON_OVERLAY_WIDTH / 2) /
            FRONT_BUTTON_OVERLAY_WIDTH;
          const uHalf = fit.width / 2 / FRONT_BUTTON_OVERLAY_WIDTH;
          const vHalf = fit.height / 2 / FRONT_BUTTON_OVERLAY_HEIGHT;
          const positions = geometry.getAttribute("position");

          for (let vertex = 0; vertex < uv.count; vertex += 1) {
            const localU = THREE.MathUtils.clamp(
              positions.getX(vertex) / fit.width + 0.5,
              0,
              1
            );
            const localV = THREE.MathUtils.clamp(
              positions.getY(vertex) / fit.height + 0.5,
              0,
              1
            );
            uv.setXY(
              vertex,
              THREE.MathUtils.lerp(
                uCenter - uHalf,
                uCenter + uHalf,
                localU
              ),
              THREE.MathUtils.lerp(
                0.5 - vHalf,
                0.5 + vHalf,
                localV
              )
            );
          }
          uv.needsUpdate = true;

          const overlay = new THREE.Mesh(geometry, [
            frontButtonMaterial,
            frontButtonSideMaterial,
          ]);
          overlay.name = `clear-front-button-symbol-${index + 1}`;
          const geometryFrontZ = geometry.boundingBox?.max.z ?? 0;
          overlay.position.set(
            fit.centerX,
            fit.centerY,
            fit.frontZ + FRONT_BUTTON_ARTWORK_CLEARANCE - geometryFrontZ
          );
          overlay.castShadow = true;
          overlay.receiveShadow = true;
          overlay.renderOrder = 5;
          root.add(overlay);
        });

        // The front and rear textures and their disconnected legacy geometry
        // are now clean while the original curved body remains visible.
        root.updateMatrixWorld(true);
        const normalizedBox = new THREE.Box3().setFromObject(root);
        const normalizedCenter = normalizedBox.getCenter(new THREE.Vector3());
        const normalizedSize = normalizedBox.getSize(new THREE.Vector3());
        const originalRearCutoutCenterY = (0.3275 - center.y) * scale;
        const originalRearPanelSurfaceZ = (REAR_PANEL_OUTER_Z - center.z) * scale;

        const panelWidth = normalizedSize.x * 0.36;
        const panelHeight = panelWidth / 4.52;
        const rearPortAssembly = createRearPortAssembly(
          renderer,
          panelWidth,
          panelHeight
        );
        rearPortAssembly.position.set(
          normalizedCenter.x,
          originalRearCutoutCenterY,
          originalRearPanelSurfaceZ
        );
        rearPortAssembly.rotation.y = Math.PI;
        productGroup.add(rearPortAssembly);

        scene.add(productGroup);
        modelRef.current = productGroup;
        setLoading(false);
      },
      (xhr) => {
        if (disposed) return;
        if (xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
        } else {
          setLoadProgress((p) => Math.min(p + 15, 90));
        }
      },
      (err) => {
        if (disposed) return;
        console.error("Error loading 3D model:", err);
        setModelError("Failed to load 3D model asset. Please check network connection.");
        setLoading(false);
      }
    );

    // Adaptive render loop: phones render at a capped frame rate, the loop
    // stops entirely when the stage/tab is hidden, and static scenes render
    // only when controls or state actually change.
    let rafId = 0;
    let lastFrameTime = 0;
    let isStageVisible = true;
    let isDocumentVisible = !document.hidden;
    const minimumFrameDuration = 1000 / renderProfile.maxFps;

    const cancelScheduledFrame = () => {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const requestFrame = () => {
      if (
        disposed ||
        rafId ||
        !isStageVisible ||
        !isDocumentVisible
      ) {
        return;
      }
      rafId = requestAnimationFrame(animate);
    };

    const animate = (frameTime: number) => {
      rafId = 0;
      if (disposed || !isStageVisible || !isDocumentVisible) return;

      if (
        lastFrameTime > 0 &&
        frameTime - lastFrameTime < minimumFrameDuration - 1
      ) {
        requestFrame();
        return;
      }

      const deltaSeconds = lastFrameTime
        ? Math.min((frameTime - lastFrameTime) / 1000, 0.1)
        : 1 / renderProfile.maxFps;
      lastFrameTime = frameTime;
      const elapsed = frameTime / 1000;

      const currentRgb = selectedRgbRef.current;

      // Update 360° ring color via shader uniform in real-time
      if (currentRgb.isRainbow) {
        const hue = (elapsed * 0.2) % 1;
        rgbUniforms.current.uRgbColor.value.setHSL(hue, 1.0, 0.55);
        rgbUniforms.current.uRgbGlow.value = 0.7 + Math.sin(elapsed * 3) * 0.15;
      } else {
        rgbUniforms.current.uRgbColor.value.set(currentRgb.hex);
        rgbUniforms.current.uRgbGlow.value = 0.7;
      }

      // Smooth camera interpolation on hotspot selection
      const cameraLerp = 1 - Math.exp(-4 * deltaSeconds);
      if (targetCamPos.current && cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, cameraLerp);
        if (cameraRef.current.position.distanceTo(targetCamPos.current) < 0.01) {
          targetCamPos.current = null;
        }
      }

      if (targetLookPos.current && controlsRef.current) {
        controlsRef.current.target.lerp(targetLookPos.current, cameraLerp);
        if (controlsRef.current.target.distanceTo(targetLookPos.current) < 0.01) {
          targetLookPos.current = null;
        }
      }

      const controlsChanged = controls.update(deltaSeconds);
      renderer.render(scene, camera);

      if (
        currentRgb.isRainbow ||
        controls.autoRotate ||
        controlsChanged ||
        targetCamPos.current ||
        targetLookPos.current
      ) {
        requestFrame();
      }
    };

    requestRenderRef.current = requestFrame;
    controls.addEventListener("change", requestFrame);

    // Observe the stage rather than the whole window, so rotations and
    // fullscreen changes resize correctly without layout polling.
    const handleResize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      requestFrame();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const stageObserver = new IntersectionObserver(
      ([entry]) => {
        isStageVisible = entry?.isIntersecting ?? true;
        if (isStageVisible) requestFrame();
        else cancelScheduledFrame();
      },
      { rootMargin: "160px" }
    );
    stageObserver.observe(container);

    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      if (isDocumentVisible) requestFrame();
      else cancelScheduledFrame();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    handleResize();
    requestFrame();

    return () => {
      disposed = true;
      cancelScheduledFrame();
      resizeObserver.disconnect();
      stageObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      controls.removeEventListener("change", requestFrame);
      controls.dispose();
      requestRenderRef.current = () => {};
      disposeObjectResources(scene);
      scene.clear();
      renderer.renderLists.dispose();
      renderer.dispose();
      RENDER_PROFILES.delete(renderer);
    };
  }, []);

  useEffect(() => {
    selectedRgbRef.current = selectedRgb;
    requestRenderRef.current();
  }, [selectedRgb]);

  // Handle Controls Updates
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      requestRenderRef.current();
    }
  }, [autoRotate]);

  // Handle Lighting Updates based on backdrop
  useEffect(() => {
    if (!lightsRef.current) return;
    const { ambient, dirLight1, dirLight2 } = lightsRef.current;

    if (showRoomBackdrop) {
      ambient.intensity = 1.1;
      dirLight1.intensity = 2.4;
      dirLight2.intensity = 1.3;
    } else {
      ambient.intensity = 1.3;
      dirLight1.intensity = 2.6;
      dirLight2.intensity = 1.5;
    }
    requestRenderRef.current();
  }, [showRoomBackdrop]);

  // Select Hotspot
  const handleSelectHotspot = useCallback((spot: Hotspot) => {
    setActiveHotspot(spot.id);
    targetCamPos.current = getResponsiveCameraPosition(spot.cameraPos);
    targetLookPos.current = new THREE.Vector3(...spot.targetPos);
    setAutoRotate(false);
    requestRenderRef.current();
  }, []);

  // Reset Camera View
  const handleResetView = useCallback(() => {
    setActiveHotspot("overview");
    targetCamPos.current = getResponsiveCameraPosition([0, 0.2, 2.2]);
    targetLookPos.current = new THREE.Vector3(0, 0, 0);
    setAutoRotate(true);
    requestRenderRef.current();
  }, []);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <section
      id="3d-studio"
      className="relative overflow-hidden border-t border-border bg-background px-4 py-16 md:px-12 md:py-24"
    >
      <div className="relative mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-mono tracking-[0.25em] text-muted-foreground uppercase">
              3D Visualizer
            </p>
            <h2 className="mt-2 text-3xl font-semibold sm:text-4xl md:text-5xl">
              Inspect in <span className="text-spectrum">360°</span>
            </h2>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Drag to orbit, scroll to zoom, and test ambient light colors in real time.
          </p>
        </div>

        {/* 3D Studio Stage Container */}
        <div
          ref={containerRef}
          className={`group relative mt-8 overflow-hidden rounded-2xl border border-border bg-card/30 transition-all duration-500 md:rounded-3xl ${
            isFullscreen
              ? "h-screen w-screen rounded-none border-none"
              : "h-[65svh] min-h-[480px] max-h-[680px] md:h-[680px]"
          }`}
        >
          {/* Photorealistic Centered Bedside Room Environment Backdrop */}
          <div
            className={`absolute inset-0 bg-cover bg-no-repeat transition-all duration-700 pointer-events-none ${
              showRoomBackdrop ? "opacity-100 scale-100 filter-none" : "opacity-0 scale-105 blur-sm"
            }`}
            style={{
              backgroundImage: "url('/bedside-room-backdrop.jpg')",
              backgroundPosition: "center bottom",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-background/50" />
            <div className="absolute inset-0 bg-black/25" />
          </div>

          {/* Minimal Studio Dark Backdrop */}
          <div
            className={`absolute inset-0 bg-gradient-to-b from-card/80 via-background/90 to-background transition-opacity duration-700 pointer-events-none ${
              !showRoomBackdrop ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
          </div>

          {/* WebGL Canvas */}
          <canvas
            ref={canvasRef}
            className="relative z-10 h-full w-full cursor-grab active:cursor-grabbing touch-none"
            aria-label="Interactive 3D model of Deal Drip speaker"
          />

          {/* Loading Indicator */}
          {loading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-border" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-foreground border-t-transparent animate-spin"
                  style={{ animationDuration: "1s" }}
                />
              </div>
              <p className="mt-4 font-mono text-xs tracking-wider text-muted-foreground uppercase">
                Loading 3D Studio... {loadProgress}%
              </p>
            </div>
          )}

          {/* Error Display if GLB fails */}
          {modelError && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/90 p-6 text-center">
              <HelpCircle className="h-8 w-8 text-destructive" />
              <p className="mt-3 text-xs text-foreground">{modelError}</p>
            </div>
          )}

          {/* Top Controls Bar */}
          <div className="pointer-events-none absolute top-3 right-3 left-3 z-20 flex items-center justify-between gap-2 sm:top-4 sm:right-4 sm:left-4">
            {/* Minimal Color Swatches Bar */}
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 p-1.5 shadow-sm backdrop-blur-md">
              {RGB_COLOR_OPTIONS.map((c) => {
                const isSelected = selectedRgb.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedRgb(c)}
                    title={`Color: ${c.name}`}
                    className={`relative h-6 w-6 rounded-full transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "scale-110 ring-2 ring-foreground"
                        : "opacity-75 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{
                      background: c.isRainbow
                        ? "linear-gradient(135deg, #00f0ff, #b829ff, #00ff88)"
                        : c.hex,
                    }}
                  />
                );
              })}
            </div>

            {/* Utility Actions */}
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/60 bg-background/80 p-1 shadow-sm backdrop-blur-md">
              {/* Scene Backdrop Toggle */}
              <button
                onClick={() => setShowRoomBackdrop((v) => !v)}
                title={showRoomBackdrop ? "Switch to Dark Studio" : "Switch to Room Scene"}
                className={`rounded-full p-2 text-xs transition-all ${
                  showRoomBackdrop
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {showRoomBackdrop ? (
                  <Home className="h-3.5 w-3.5" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Auto-Rotate Switch */}
              <button
                onClick={() => setAutoRotate((v) => !v)}
                title={autoRotate ? "Pause Auto-Rotate" : "Start Auto-Rotate"}
                className={`rounded-full p-2 text-xs transition-all ${
                  autoRotate
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>

              {/* Reset View */}
              <button
                onClick={handleResetView}
                title="Reset Camera View"
                className="rounded-full p-2 text-muted-foreground transition-all hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
                className="hidden sm:inline-flex rounded-full p-2 text-muted-foreground transition-all hover:text-foreground"
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom Hotspots Inspection Bar */}
          <div className="absolute right-3 bottom-3 left-3 z-20 flex flex-col items-center gap-2 sm:right-6 sm:bottom-6 sm:left-6">
            <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-border/60 bg-background/80 p-1 shadow-sm backdrop-blur-md">
              {HOTSPOTS.map((spot) => {
                const isActive = activeHotspot === spot.id;
                return (
                  <button
                    key={spot.id}
                    onClick={() => handleSelectHotspot(spot)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium tracking-wider uppercase transition-all cursor-pointer ${
                      isActive
                        ? "bg-foreground text-background shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {spot.name}
                  </button>
                );
              })}
            </div>

            {/* Active Hotspot Caption */}
            {activeHotspot && (
              <p className="max-w-md rounded-full border border-border/40 bg-background/90 px-3.5 py-1 text-center text-[11px] text-muted-foreground backdrop-blur-md">
                {HOTSPOTS.find((h) => h.id === activeHotspot)?.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}