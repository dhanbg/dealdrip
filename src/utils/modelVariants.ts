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

    // 1. Lighting parts: make invisible / turned off
    // Top inset light guide ring: completely invisible
    if (name.startsWith('top-inset-light-guide')) {
      mesh.visible = false;
      return;
    }

    // Housing light band: turn off emissive cyan glow and blend invisibly into dark continuous housing
    if (name.includes('476999') || name.includes('51381b')) {
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (m) {
          if (m.emissive) m.emissive.setRGB(0, 0, 0);
          if (m.color) m.color.setRGB(0.015, 0.015, 0.023);
          m.roughness = 0.36;
          m.metalness = 0.08;
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
    const isTopSurface = TOP_SURFACE_PREFIXES.some((p) => name.startsWith(p));
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
      if (name.startsWith('wireless-pad-embossed-bolt')) {
        // Charging bolt icon: subtle elegant contrast on white charging disc
        whiteMat.color.setRGB(0.74, 0.77, 0.80);
        whiteMat.roughness = 0.45;
        whiteMat.metalness = 0.04;
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
        // Inner top charging surface (smooth panel, outer ring, raised disc) & bottom base housing
        whiteMat.color.setRGB(0.95, 0.96, 0.97);
        whiteMat.roughness = isTopSurface ? 0.30 : 0.38;
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
 * while the top border remains sleek black, lighting parts remain invisible,
 * and the heather grey fabric, LED clock, and front controls remain intact.
 */
export function applySpeakerVariant(root: THREE.Object3D, variant: 'black' | 'white') {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh) {
      if (mesh.name && mesh.name.startsWith('top-inset-light-guide')) {
        mesh.visible = false;
      }
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
