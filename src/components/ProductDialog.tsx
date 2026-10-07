'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useStore } from '@/context/StoreContext';
import { catalog, formatMoney, getPreviewUrl, getModelUrl } from '@/data/catalog';

// Cache for loaded GLTF models to make reopen instantaneous
const modelCache = new Map<string, Promise<any>>();

function loadModelCached(file: string, dracoLoader: DRACOLoader) {
  if (!modelCache.has(file)) {
    const loader = new GLTFLoader().setDRACOLoader(dracoLoader);
    const promise = loader.loadAsync(`/assets/models/${file}.glb?v=3`).catch((err) => {
      modelCache.delete(file);
      throw err;
    });
    modelCache.set(file, promise);
  }
  return modelCache.get(file)!;
}

function normalizedModel(gltf: any, size = 3.3) {
  const content = gltf.scene.clone(true);

  content.traverse((child: any) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m: any) => {
        if (!m) return;

        // Gently deepen the speaker fabric so it has a rich heather grey tone matching the product photo
        if (
          m.name === 'Dark enlarged woven fabric' ||
          (child.name && child.name.includes('92eb65'))
        ) {
          if (m.color) m.color.setRGB(0.50, 0.51, 0.53);
          m.roughness = 0.88;
          m.needsUpdate = true;
        }

        // Prevent Z-fighting and flickering on printed decals (Focusrite Scarlett Solo models, etc.)
        if (m.name && m.name.startsWith('Print:')) {
          m.polygonOffset = true;
          m.polygonOffsetFactor = -4.0;
          m.polygonOffsetUnits = -4.0;
          m.depthWrite = false;
          m.depthTest = true;
          m.needsUpdate = true;
        }
      });
    }

    // Physical bias for Focusrite Scarlett Solo 3rd Gen & 4th Gen decals to eliminate coplanar flickering:
    // 1. Top Focusrite logo: bias upward away from the red aluminium casing
    const isScarlettTopLogo =
      (child.name === 'Label - Focusrite' ||
        (child.material &&
          (Array.isArray(child.material) ? child.material : [child.material]).some(
            (m: any) => m?.name === 'Print: Focusrite'
          ))) &&
      child.position &&
      child.position.y > 40;

    // 2. Bottom labels (Focusrite Scarlett Solo, Gen label, USB power label): bias downward away from chassis and sticker
    const isScarlettBottomLabel =
      child.position &&
      child.position.y < 10 &&
      ((child.name &&
        (child.name === 'Label - Focusrite Scarlett Solo' ||
          child.name.includes('Generation') ||
          child.name.includes('USB power') ||
          child.name.includes('USB bus powered') ||
          child.name.includes('5V DC'))) ||
        (child.material &&
          (Array.isArray(child.material) ? child.material : [child.material]).some(
            (m: any) =>
              m?.name === 'Print: Focusrite Scarlett Solo' ||
              (m?.name && m.name.includes('Generation')) ||
              (m?.name && m.name.includes('USB')) ||
              (m?.name && m.name.includes('5V DC'))
          )));

    if (isScarlettTopLogo) {
      child.position.y += 0.06;
    } else if (isScarlettBottomLabel) {
      child.position.y -= 0.06;
    }

    // 3. Underside technical label / sticker: slight bias downward to prevent coplanar fighting with casing
    if (
      child.name &&
      child.position &&
      (child.name === 'Underside technical label' ||
        child.name === 'Underside identification sticker')
    ) {
      child.position.y -= 0.02;
      if (child.material) {
        const smats = Array.isArray(child.material) ? child.material : [child.material];
        smats.forEach((sm: any) => {
          if (sm) {
            sm.polygonOffset = true;
            sm.polygonOffsetFactor = -2.0;
            sm.polygonOffsetUnits = -2.0;
            sm.needsUpdate = true;
          }
        });
      }
    }
  });

  content.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(content);
  const center = box.getCenter(new THREE.Vector3());
  const dimensions = box.getSize(new THREE.Vector3());
  content.position.sub(center);

  const normalizer = new THREE.Group();
  normalizer.add(content);
  normalizer.scale.setScalar(size / Math.max(dimensions.x, dimensions.y, dimensions.z));

  const group = new THREE.Group();
  group.add(normalizer);
  return { group, content, animations: gltf.animations };
}

function getProductInitialRotation(productId: string) {
  if (productId === 'speaker') return { x: 0.08, y: 0.0 };
  if (productId.startsWith('scarlett')) return { x: 0.08, y: 0.0 };
  if (productId === 'keyboard') return { x: 0.32, y: 0.0 };
  if (productId === 'bottle') return { x: 0.0, y: 0.0 };
  return { x: 0.08, y: 0.0 };
}

export function ProductDialog() {
  const { quickviewProduct, closeQuickview, addToBag } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [modelStatus, setModelStatus] = useState('Loading your closer look…');
  const [modelReady, setModelReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef({ x: 0.12, y: -0.15 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (quickviewProduct) {
      setQuantity(1);
      setModelStatus('Loading your closer look…');
      setModelReady(false);
      const initRot = getProductInitialRotation(quickviewProduct.id);
      rotationRef.current = { x: initRot.x, y: initRot.y };
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeQuickview();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [quickviewProduct, closeQuickview]);

  // Three.js 3D stage setup for modal
  useEffect(() => {
    if (!quickviewProduct || !canvasRef.current) return;

    let active = true;
    const canvas = canvasRef.current;
    let renderer: THREE.WebGLRenderer | null = null;
    let envTexture: THREE.Texture | null = null;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      renderer.setClearColor(0x14151a, 1);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
      camera.position.set(0, 0, 7.3);
      camera.lookAt(0, 0, 0);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const env = pmrem.fromScene(room, 0.04);
      envTexture = env.texture;
      scene.environment = envTexture;
      room.dispose();
      pmrem.dispose();

      scene.add(new THREE.HemisphereLight(0xffffff, 0x1a202c, 0.55));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
      keyLight.position.set(4, 6, 7);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
      rimLight.position.set(-4, 3, -2);
      scene.add(rimLight);

      let currentModel: any = null;

      const resize = () => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        renderer?.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      resize();

      const draco = new DRACOLoader().setDecoderPath('/assets/draco/').setWorkerLimit(2);

      if (quickviewProduct.id === 'keyboard') {
        Promise.all([
          loadModelCached('twolf-tf200-keyboard-web', draco),
          loadModelCached('mouse-web', draco),
        ])
          .then(([keyboardGltf, mouseGltf]) => {
            if (!active) return;
            const comboGroup = new THREE.Group();

            const kModel = normalizedModel(keyboardGltf, 2.9);
            kModel.group.position.set(-0.45, 0, -0.05);
            comboGroup.add(kModel.group);

            const mModel = normalizedModel(mouseGltf, 1.05);
            mModel.group.position.set(1.5, -0.04, 0.35);
            comboGroup.add(mModel.group);

            const initRot = getProductInitialRotation(quickviewProduct.id);
            comboGroup.rotation.set(initRot.x, initRot.y, 0);
            scene.add(comboGroup);
            currentModel = { group: comboGroup, content: comboGroup, animations: [] };
            setModelReady(true);
            setModelStatus('');
          })
          .catch(() => {
            if (!active) return;
            setModelStatus('3D preview unavailable. Product image shown.');
          });
      } else {
        loadModelCached(quickviewProduct.file, draco)
          .then((gltf) => {
            if (!active) return;
            currentModel = normalizedModel(gltf, 3.3);
            const initRot = getProductInitialRotation(quickviewProduct.id);
            currentModel.group.rotation.set(initRot.x, initRot.y, 0);
            scene.add(currentModel.group);
            setModelReady(true);
            setModelStatus('');
          })
          .catch(() => {
            if (!active) return;
            setModelStatus('3D preview unavailable. Product image shown.');
          });
      }

      // Pointer drag interaction
      let down = false;
      let lastX = 0;
      let lastY = 0;

      const onPointerDown = (e: PointerEvent) => {
        down = true;
        lastX = e.clientX;
        lastY = e.clientY;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {}
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!down) return;
        e.preventDefault();
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        rotationRef.current.y += dx * 0.008;
        rotationRef.current.x = THREE.MathUtils.clamp(
          rotationRef.current.x + dy * 0.004,
          -0.55,
          0.6
        );
        lastX = e.clientX;
        lastY = e.clientY;
      };

      const onPointerUp = (e: PointerEvent) => {
        down = false;
        try {
          if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
          }
        } catch {}
      };

      const onTouchStart = (e: TouchEvent) => {
        if (e.cancelable) e.preventDefault();
      };

      const onTouchMove = (e: TouchEvent) => {
        if (e.cancelable) e.preventDefault();
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault();
          if (e.key === 'ArrowLeft') rotationRef.current.y -= 0.15;
          if (e.key === 'ArrowRight') rotationRef.current.y += 0.15;
          if (e.key === 'ArrowUp') rotationRef.current.x -= 0.1;
          if (e.key === 'ArrowDown') rotationRef.current.x += 0.1;
        }
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('wheel', onWheel, { passive: false });
      canvas.addEventListener('keydown', onKeyDown);

      // Render loop
      const render = () => {
        if (!active) return;
        if (currentModel) {
          currentModel.group.rotation.set(
            rotationRef.current.x,
            rotationRef.current.y,
            0
          );
        }
        renderer?.render(scene, camera);
        animFrameRef.current = requestAnimationFrame(render);
      };
      animFrameRef.current = requestAnimationFrame(render);

      return () => {
        active = false;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        resizeObserver.disconnect();
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('pointercancel', onPointerUp);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('wheel', onWheel);
        canvas.removeEventListener('keydown', onKeyDown);
        envTexture?.dispose();
        renderer?.dispose();
        draco.dispose();
      };
    } catch {
      setModelStatus('3D preview unavailable. Product image shown.');
    }
  }, [quickviewProduct]);

  if (!quickviewProduct) return null;

  const objectIndex =
    'OBJECT ' + String(catalog.indexOf(quickviewProduct) + 1).padStart(2, '0');

  const handleAdd = () => {
    addToBag(quickviewProduct.id, quantity);
  };

  return (
    <div
      className="dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeQuickview();
      }}
    >
      <div
        className="product-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          className="dialog-close icon-button"
          onClick={closeQuickview}
          aria-label="Close product details"
        >
          ×
        </button>

        <div className="modal-visual">
          <span className="modal-object-index">{objectIndex}</span>
          <img
            id="modal-poster"
            src={getPreviewUrl(quickviewProduct)}
            alt={quickviewProduct.name}
            style={{ display: modelReady ? 'none' : 'block' }}
          />
          <canvas
            ref={canvasRef}
            id="modal-canvas"
            tabIndex={0}
            role="img"
            aria-label="3D product. Drag or use arrow keys to rotate."
            style={{ opacity: modelReady ? 1 : 0, transition: 'opacity 0.4s ease' }}
          />
          <div className="modal-drag-hint">
            Drag to rotate <span>·</span> Every angle, yours.
          </div>
          {modelStatus && <div className="model-status">{modelStatus}</div>}
        </div>

        <div className="modal-info">
          <span className="eyebrow" id="modal-category">
            {quickviewProduct.category}
          </span>
          <h2 id="modal-title">{quickviewProduct.name}</h2>
          <p className="modal-price">{formatMoney(quickviewProduct.price)}</p>
          <p id="modal-description">{quickviewProduct.description}</p>

          <div className="finish-label">
            <span>Finish</span>
            <span id="modal-finish">{quickviewProduct.finish}</span>
          </div>
          <div
            className="finish-swatch"
            style={{ background: quickviewProduct.color }}
          />

          <ul id="modal-features">
            {quickviewProduct.features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>

          <div className="buy-controls">
            <div className="quantity-picker">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <output aria-label="Quantity">{quantity}</output>
              <button
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button className="button button-lime" onClick={handleAdd}>
              Add to bag <span aria-hidden="true">+</span>
            </button>
          </div>

          <div className="modal-bottom-note">
            A little closer to your next setup.
          </div>
        </div>
      </div>
    </div>
  );
}
