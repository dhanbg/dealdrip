import * as THREE from 'three';

// Node name prefixes for the inner top wireless charging surface (becomes white in white variant)
const TOP_SURFACE_PREFIXES = [
  'top-smooth-panel',
  'wireless-pad-outer-ring',
  'wireless-pad-raised-disc',
  'wireless-pad-embossed-bolt',
];

// Node name prefixes & hashes for the top border / outer trim (kept sleek black in both variants)
const TOP_BORDER_PREFIXES = [
  'top-outer-trim',
];

const TOP_BORDER_HASHES = [
  '0eedc6',
  '2039bf',
  '1d0ba4',
  '7308da',
];

// Node name suffixes for bottom base housing below fabric
const BOTTOM_BASE_HASHES = [
  '48d254',
  '64915a',
  '362058',
  '4d19e7',
  '60333a',
  '7610cc',
  '59fa7f',
];

// Node name prefixes for other bottom parts (vents, feet, rear capsule)
const BOTTOM_PREFIXES = [
  'Recessed bottom vent',
  'Vent molded edge',
  'bottom-foot-collar',
  'bottom-foot-seam',
  'rear-io-molded-capsule',
];

/**
 * Traverses speaker model scene, deepens the fabric tone, configures
 * dual-variant (Black / White) materials on the inner top charging surface
 * and bottom base, keeps the top border black, and makes lighting parts invisible.
 */
export function setupSpeakerModel(content: THREE.Object3D) {
  content.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const name = mesh.name || '';
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    // Gently deepen the speaker fabric so it has a rich heather grey tone matching product photo
    mats.forEach((mat) => {
      const m = mat as THREE.MeshStandardMaterial;
      if (
        m.name === 'Dark enlarged woven fabric' ||
        name.includes('92eb65')
      ) {
        if (m.color) m.color.setRGB(0.50, 0.51, 0.53);
        m.roughness = 0.88;
        m.needsUpdate = true;
      }
    });

    // 1. Top inset light guide: soft clean frosted bezel transition (scaled to keep border slim/short)
    if (name.startsWith('top-inset-light-guide')) {
      mesh.scale.set(1.045, 1.045, 1.0);
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (m) {
          m.color.setRGB(0.86, 0.89, 0.92);
          m.roughness = 0.28;
          m.metalness = 0.04;
          m.needsUpdate = true;
        }
      });
      return;
    }

    // RGB lighting band on housing: keep vibrant RGB cyan glow active in both variants
    if (name.includes('476999') || name.includes('51381b')) {
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (m) {
          if (m.emissive) m.emissive.setRGB(0, 0.723, 0.847);
          if (m.color) m.color.setRGB(0.216, 0.718, 0.753);
          m.roughness = 0.36;
          m.metalness = 0.0;
          m.needsUpdate = true;
        }
      });
      return;
    }

    // 2. Top border part: ensure rich sleek black in both variants
    const isTopBorder =
      TOP_BORDER_PREFIXES.some((p) => name.startsWith(p)) ||
      TOP_BORDER_HASHES.some((h) => name.includes(h));

    if (isTopBorder) {
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (m && m.color) {
          m.color.setRGB(0.012, 0.014, 0.016);
          m.roughness = 0.28;
          m.metalness = 0.15;
          m.needsUpdate = true;
        }
      });
      return;
    }

    // 3. Dual-variant parts: inner top surface & bottom base
    const nodeName = ((mesh.userData && mesh.userData.name) || '').toLowerCase();
    const lowerName = name.toLowerCase();

    const isRing =
      lowerName.includes('wireless-pad-outer-ring') ||
      lowerName === 'gltf_3' ||
      lowerName.includes('gltf_3') ||
      nodeName.includes('wireless-pad-outer-ring');

    const isDisc =
      lowerName.includes('wireless-pad-raised-disc') ||
      lowerName === 'gltf_4' ||
      lowerName.includes('gltf_4') ||
      nodeName.includes('wireless-pad-raised-disc');

    const isBolt =
      lowerName.includes('wireless-pad-embossed-bolt') ||
      lowerName === 'gltf_5' ||
      lowerName.includes('gltf_5') ||
      nodeName.includes('wireless-pad-embossed-bolt');

    const isPanel =
      lowerName.includes('top-smooth-panel') ||
      lowerName === 'gltf_2' ||
      lowerName.includes('gltf_2') ||
      nodeName.includes('top-smooth-panel');

    if (isPanel) {
      mesh.scale.set(1.045, 1.045, 1.0);
    }

    const isTopSurface = isRing || isDisc || isBolt || isPanel;
    const isBottom =
      BOTTOM_BASE_HASHES.some((h) => name.includes(h)) ||
      BOTTOM_PREFIXES.some((p) => name.startsWith(p));

    if (isTopSurface || isBottom) {
      mesh.userData.isSpeakerSurface = isTopSurface;
      mesh.userData.isSpeakerBottom = isBottom;

      // Cache a clone of original default (black) material
      const baseMat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
      mesh.userData.blackMat = baseMat.clone();

      // Create and configure pristine white material
      const whiteMat = baseMat.clone();
      if (isRing) {
        // Lighting circle ring: defined metallic silver ring with crisp PBR specular highlight
        whiteMat.color.setRGB(0.42, 0.46, 0.52); // Refined metallic silver (#6b7280)
        if (whiteMat.emissive) whiteMat.emissive.setRGB(0, 0, 0);
        whiteMat.roughness = 0.24;
        whiteMat.metalness = 0.60;
        whiteMat.polygonOffset = true;
        whiteMat.polygonOffsetFactor = -6.0;
        whiteMat.polygonOffsetUnits = -6.0;
        mesh.renderOrder = 20;
        mesh.position.y += 0.003;
      } else if (isBolt) {
        // Charging lightning bolt logo: embossed titanium gray showing crisp 3D beveled detail like the black variant
        whiteMat.color.setRGB(0.20, 0.24, 0.28); // Titanium / slate gray (#334155)
        if (whiteMat.emissive) whiteMat.emissive.setRGB(0, 0, 0);
        whiteMat.roughness = 0.26;
        whiteMat.metalness = 0.45;
        whiteMat.polygonOffset = true;
        whiteMat.polygonOffsetFactor = -8.0;
        whiteMat.polygonOffsetUnits = -8.0;
        mesh.renderOrder = 25;
        mesh.position.y += 0.005;
      } else if (isDisc) {
        // Raised charging disc: clean soft-slate pearl silicone pad providing subtle recessed disc depth
        whiteMat.color.setRGB(0.84, 0.87, 0.90);
        if (whiteMat.emissive) whiteMat.emissive.setRGB(0, 0, 0);
        whiteMat.roughness = 0.45;
        whiteMat.metalness = 0.04;
        whiteMat.polygonOffset = true;
        whiteMat.polygonOffsetFactor = -3.0;
        whiteMat.polygonOffsetUnits = -3.0;
        mesh.renderOrder = 15;
        mesh.position.y += 0.001;
      } else if (isPanel) {
        // Surrounding top panel: pristine satin white deck
        whiteMat.color.setRGB(0.95, 0.96, 0.97);
        if (whiteMat.emissive) whiteMat.emissive.setRGB(0, 0, 0);
        whiteMat.roughness = 0.45;
        whiteMat.metalness = 0.02;
      } else if (name.startsWith('Recessed bottom vent') || name.startsWith('Vent molded edge')) {
        // Subtle depth shading in vents
        whiteMat.color.setRGB(0.88, 0.90, 0.92);
        whiteMat.roughness = 0.52;
        whiteMat.metalness = 0.01;
      } else if (name.startsWith('bottom-foot-')) {
        // Foot collars & seams
        whiteMat.color.setRGB(0.90, 0.92, 0.94);
        whiteMat.roughness = 0.45;
        whiteMat.metalness = 0.02;
      } else if (name.startsWith('rear-io-molded-capsule')) {
        // Rear IO molded capsule
        whiteMat.color.setRGB(0.92, 0.94, 0.95);
        whiteMat.roughness = 0.42;
        whiteMat.metalness = 0.02;
      } else {
        // Bottom base housing
        whiteMat.color.setRGB(0.95, 0.96, 0.97);
        whiteMat.roughness = 0.38;
        whiteMat.metalness = 0.02;
      }
      whiteMat.needsUpdate = true;
      mesh.userData.whiteMat = whiteMat;
    }
  });
}

/**
 * Switch the speaker between 'black' (default) and 'white' variants instantly.
 * In white variant, inner top charging surface and bottom base become white,
 * the lighting circle glows cyan on the charging pad, the top border remains
 * sleek black, and the RGB strip on the housing remains active.
 */
export function applySpeakerVariant(root: THREE.Object3D, variant: 'black' | 'white') {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      if (mesh.userData.isSpeakerSurface || mesh.userData.isSpeakerBottom) {
        if (variant === 'white' && mesh.userData.whiteMat) {
          mesh.material = mesh.userData.whiteMat;
        } else if (mesh.userData.blackMat) {
          mesh.material = mesh.userData.blackMat;
        }
      }
    }
  });
}

export type BottleVariant = 'sage' | 'pink' | 'aqua' | 'grey';

export interface BottleVariantConfig {
  name: string;
  color: { r: number; g: number; b: number };
  roughness: number;
  metalness: number;
}

export const BOTTLE_VARIANT_CONFIGS: Record<BottleVariant, BottleVariantConfig> = {
  sage: {
    name: 'Sage green',
    color: { r: 0.58, g: 0.72, b: 0.56 }, // soft pastel sage (#9bbd9e)
    roughness: 0.70,
    metalness: 0.02,
  },
  pink: {
    name: 'Blush pink',
    color: { r: 0.92, g: 0.48, b: 0.54 }, // rich pastel blush pink (#ee8e9b)
    roughness: 0.70,
    metalness: 0.02,
  },
  aqua: {
    name: 'Aqua blue',
    color: { r: 0.24, g: 0.75, b: 0.85 }, // vibrant sky/aqua cyan (#48c0d6)
    roughness: 0.68,
    metalness: 0.02,
  },
  grey: {
    name: 'Slate grey',
    color: { r: 0.52, g: 0.54, b: 0.57 }, // modern cool slate grey (#878c94)
    roughness: 0.72,
    metalness: 0.04,
  },
};

/**
 * Configure 3D materials for the foldable silicone bottle model across all variants.
 */
export function setupBottleModel(content: THREE.Object3D) {
  content.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const baseMat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
    if (!baseMat) return;

    mesh.userData.isBottleMesh = true;
    mesh.userData.originalBottleMat = baseMat;

    // Cache pre-configured materials for each variant so switching in 3D modal is instant
    const variantMats: Record<string, THREE.MeshStandardMaterial> = {};
    (Object.keys(BOTTLE_VARIANT_CONFIGS) as BottleVariant[]).forEach((vKey) => {
      const cfg = BOTTLE_VARIANT_CONFIGS[vKey];
      const vMat = baseMat.clone();
      vMat.color.setRGB(cfg.color.r, cfg.color.g, cfg.color.b);
      vMat.roughness = cfg.roughness;
      vMat.metalness = cfg.metalness;
      vMat.needsUpdate = true;
      variantMats[vKey] = vMat;
    });

    mesh.userData.bottleVariantMats = variantMats;
  });
}

/**
 * Apply the selected bottle variant to the 3D model.
 */
export function applyBottleVariant(root: THREE.Object3D, variantId: string) {
  const targetKey = (variantId in BOTTLE_VARIANT_CONFIGS ? variantId : 'sage') as BottleVariant;
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.userData.isBottleMesh && mesh.userData.bottleVariantMats) {
      const targetMat = mesh.userData.bottleVariantMats[targetKey];
      if (targetMat) {
        mesh.material = targetMat;
      }
    }
  });
}

export type PremiumCableVariant =
  | 'red'
  | 'navy'
  | 'green'
  | 'black'
  | 'white'
  | 'orange'
  | 'lavender';

export interface PremiumCableVariantConfig {
  name: string;
  color: string;
  textureUrl: string;
  roughness: number;
  metalness: number;
}

export const PREMIUM_CABLE_CONFIGS: Record<PremiumCableVariant, PremiumCableVariantConfig> = {
  red: {
    name: 'Crimson red',
    color: '#c52233',
    textureUrl: '/assets/textures/3-in-1-premium-basecolor-red.webp',
    roughness: 0.28,
    metalness: 0.05,
  },
  navy: {
    name: 'Navy blue',
    color: '#1a294a',
    textureUrl: '/assets/textures/3-in-1-premium-basecolor-navy.webp',
    roughness: 0.24,
    metalness: 0.08,
  },
  green: {
    name: 'Pine green',
    color: '#2d5a43',
    textureUrl: '/assets/textures/3-in-1-premium-basecolor-green.webp',
    roughness: 0.26,
    metalness: 0.06,
  },
  black: {
    name: 'Obsidian black',
    color: '#1f232b',
    textureUrl: '/assets/textures/3-in-1-premium-basecolor-black.webp',
    roughness: 0.20,
    metalness: 0.12,
  },
  white: {
    name: 'Pearl white',
    color: '#f5f6f8',
    textureUrl: '/assets/textures/3-in-1-premium-basecolor-white.webp',
    roughness: 0.35,
    metalness: 0.02,
  },
  orange: {
    name: 'Sunset orange',
    color: '#f26435',
    textureUrl: '/assets/textures/3-in-1-premium-basecolor-orange.webp',
    roughness: 0.28,
    metalness: 0.05,
  },
  lavender: {
    name: 'Soft lavender',
    color: '#c6bfd4',
    textureUrl: '/assets/textures/3-in-1-premium-basecolor-lavender.webp',
    roughness: 0.38,
    metalness: 0.02,
  },
};

const premiumTextureCache: Record<string, THREE.Texture> = {};

/**
 * Configure 3D materials for the 3-in-1 Premium cable across all 7 variants.
 */
export function setupPremiumCableModel(content: THREE.Object3D) {
  const loader = new THREE.TextureLoader();

  content.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const baseMat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
    if (!baseMat) return;

    if (mesh.name === 'Original body and cables' || (baseMat.name && baseMat.name.includes('tripo_material'))) {
      mesh.userData.isPremiumCableMesh = true;
      mesh.userData.originalPremiumMat = baseMat;

      const variantMats: Record<string, THREE.MeshStandardMaterial> = {};

      (Object.keys(PREMIUM_CABLE_CONFIGS) as PremiumCableVariant[]).forEach((vKey) => {
        const cfg = PREMIUM_CABLE_CONFIGS[vKey];
        const vMat = baseMat.clone();
        vMat.roughness = cfg.roughness;
        vMat.metalness = cfg.metalness;

        if (vKey === 'lavender') {
          vMat.map = baseMat.map;
          vMat.needsUpdate = true;
        } else {
          if (premiumTextureCache[vKey]) {
            vMat.map = premiumTextureCache[vKey];
            vMat.needsUpdate = true;
          } else {
            loader.load(cfg.textureUrl, (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.flipY = false;
              tex.needsUpdate = true;
              premiumTextureCache[vKey] = tex;
              vMat.map = tex;
              vMat.needsUpdate = true;
            });
          }
        }
        variantMats[vKey] = vMat;
      });

      mesh.userData.premiumVariantMats = variantMats;
    }
  });
}

/**
 * Apply the selected premium cable variant to the 3D model.
 */
export function applyPremiumCableVariant(root: THREE.Object3D, variantId: string) {
  const targetKey = (variantId in PREMIUM_CABLE_CONFIGS ? variantId : 'lavender') as PremiumCableVariant;
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.userData.isPremiumCableMesh && mesh.userData.premiumVariantMats) {
      const targetMat = mesh.userData.premiumVariantMats[targetKey];
      if (targetMat) {
        mesh.material = targetMat;
      }
    }
  });
}


export type BasicCableVariant = 'green' | 'red';

export interface BasicCableVariantConfig {
  name: string;
  colorHex: string;
  textureUrl: string;
}

export const BASIC_CABLE_VARIANT_CONFIGS: Record<BasicCableVariant, BasicCableVariantConfig> = {
  green: {
    name: 'Sage green',
    colorHex: '#8fa88e',
    textureUrl: '/assets/models/3-in-1-basic-green.webp',
  },
  red: {
    name: 'Coral red',
    colorHex: '#eb3d3e',
    textureUrl: '/assets/models/3-in-1-basic-red.webp',
  },
};

let cachedGreenCableTexture: THREE.Texture | null = null;
let cachedRedCableTexture: THREE.Texture | null = null;

function loadCableTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

export function getBasicCableTexture(variant: BasicCableVariant): Promise<THREE.Texture> {
  if (variant === 'green') {
    if (cachedGreenCableTexture) return Promise.resolve(cachedGreenCableTexture);
    return loadCableTexture('/assets/models/3-in-1-basic-green.webp').then((tex) => {
      cachedGreenCableTexture = tex;
      return tex;
    });
  } else {
    if (cachedRedCableTexture) return Promise.resolve(cachedRedCableTexture);
    return loadCableTexture('/assets/models/3-in-1-basic-red.webp').then((tex) => {
      cachedRedCableTexture = tex;
      return tex;
    });
  }
}

/**
 * Configure 3D materials for the 3-in-1 basic cable model across Green and Red variants.
 */
export function setupBasicCableModel(content: THREE.Object3D) {
  content.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const baseMat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
    if (!baseMat) return;

    // Mesh 0 is the body and cables with material name 'model'
    if (baseMat.name === 'model' || (mesh.name && mesh.name.toLowerCase().includes('body'))) {
      mesh.userData.isCableBody = true;
      mesh.userData.redCableMat = baseMat;

      const greenMat = baseMat.clone();
      mesh.userData.greenCableMat = greenMat;

      getBasicCableTexture('green').then((tex) => {
        greenMat.emissiveMap = tex;
        if (greenMat.map) greenMat.map = tex;
        greenMat.needsUpdate = true;
      });
    }
  });
}

/**
 * Apply the selected 3-in-1 basic cable variant to the 3D model.
 */
export function applyBasicCableVariant(root: THREE.Object3D, variantId: string) {
  const isGreen = variantId === 'green';
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.userData.isCableBody) {
      if (isGreen && mesh.userData.greenCableMat) {
        mesh.material = mesh.userData.greenCableMat;
      } else if (mesh.userData.redCableMat) {
        mesh.material = mesh.userData.redCableMat;
      }
    }
  });
}

