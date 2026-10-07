'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { chapters, getProduct, getPreviewUrl, Product } from '@/data/catalog';
import { useStore, CategoryFilter } from '@/context/StoreContext';
import {
  setupSpeakerModel,
  applySpeakerVariant,
  setupBottleModel,
  applyBottleVariant,
} from '@/utils/modelVariants';

function normalizedModel(gltf: any, size = 3.4, productId?: string) {
  const content = gltf.scene.clone(true);

  if (productId === 'speaker') {
    setupSpeakerModel(content);
  } else if (productId === 'bottle') {
    setupBottleModel(content);
    applyBottleVariant(content, 'sage');
  }

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

function getHeroDesktopSync(aspect: number) {
  const centerX = aspect * 0.998;
  const centerY = -0.065;
  const scaleMultiplier = 1.064;
  return { centerX, centerY, scaleMultiplier };
}

function getProductDesktopCenterY(index: number, baseCenterY: number) {
  switch (index) {
    case 0:
      return baseCenterY + 0.05; // Speaker: moved very little upward
    case 1:
      return baseCenterY - 0.16; // Focusrite Scarlett Solo: lowered down closer to tabletop surface
    case 2:
      return baseCenterY - 0.28; // Keyboard & mouse combo: lowered down onto tabletop surface
    case 3:
      return baseCenterY - 0.16; // Silicone Foldable Bottle: lifted up a little
    default:
      return baseCenterY;
  }
}

function getModelDesktopScale(index: number) {
  // Speaker (index 0): very little smaller (-5%)
  if (index === 0) return 0.95;
  // Keyboard & mouse combo (index 2): increased size without cropping
  if (index === 2) return 1.28;
  // Bottle (index 3): scale down from 1.0 to 0.68 so it looks naturally proportioned on desktop
  if (index === 3) return 0.68;
  return 1.0;
}

function getModelMobileScale(index: number) {
  if (index === 0) return 0.81; // Speaker: very little smaller (from 0.85 to 0.81)
  if (index === 1) return 0.72; // Scarlett Solo sound card: downscaled to give clear margin from side buttons
  if (index === 2) return 0.94; // Keyboard & mouse combo: enlarged to fill stage without cropping
  if (index === 3) return 0.48; // Silicone Foldable Bottle: scaled down to avoid looking oversized
  return 1.0;
}

function getProductMobileCenterY(index: number) {
  switch (index) {
    case 0:
      return -0.990; // Speaker: moved very little upward (from -1.040 to -0.990)
    case 1:
      return -1.080; // Focusrite Scarlett Solo: lowered down closer to tabletop surface
    case 2:
      return -1.180; // Keyboard & mouse combo: lowered down onto tabletop surface
    case 3:
      return -0.880; // Foldable bottle: lifted up a little
    default:
      return -1.040;
  }
}

function getProductBaseRotation(index: number, mobile: boolean) {
  switch (index) {
    case 0:
      // Speaker & charging dock: sleek natural angle with short, refined black border
      return { rx: mobile ? 0.16 : 0.24, ry: 0.0, rz: 0.0 };
    case 1:
      // Scarlett Solo 3rd Gen: audio interface facing fully forward front, straight and level
      return { rx: 0.08, ry: 0.0, rz: 0.0 };
    case 2:
      // TWOLF TF200 Keyboard & Mouse Combo: facing straight forward, tilted so keycaps and mouse are clearly visible
      return { rx: mobile ? 0.28 : 0.32, ry: 0.0, rz: 0.0 };
    case 3:
      // Silicone Foldable Bottle: standing upright, straight plumb, facing forward front
      return { rx: 0.0, ry: 0.0, rz: 0.0 };
    default:
      return { rx: 0.08, ry: 0.0, rz: 0.0 };
  }
}

export function HeroStory3D() {
  const { openQuickview, setFilter, speakerVariant, setSpeakerVariant } = useStore();
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [hero3dFailed, setHero3dFailed] = useState(false);
  const [loadedChapters, setLoadedChapters] = useState<number[]>([]);
  const [is3dReady, setIs3dReady] = useState(false);

  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);

  const heroModelsRef = useRef<Map<number, any>>(new Map());
  const heroRotationRef = useRef({ x: 0, y: 0 });
  const scrollTargetRef = useRef(0);
  const scrollPositionRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Synchronize 3D speaker model in hero with selected speaker variant
  useEffect(() => {
    const speakerModel = heroModelsRef.current.get(0);
    if (speakerModel) {
      applySpeakerVariant(speakerModel.group, speakerVariant);
    }
  }, [speakerVariant]);

  const currentChapter = chapters[currentChapterIdx];
  const currentProduct = getProduct(currentChapter.id) as Product;

  const totalSteps = Math.max(1, chapters.length - 1);

  const goToChapter = useCallback((index: number) => {
    if (!containerRef.current || !stickyRef.current) return;
    const story = containerRef.current;
    const travel = story.offsetHeight - stickyRef.current.offsetHeight;
    const targetY = story.offsetTop + travel * (index / totalSteps);
    window.scrollTo({
      top: targetY,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }, [totalSteps]);

  const handleCtaClick = () => {
    if (currentChapter.id === 'keyboard') {
      const playEl = document.getElementById('play');
      if (playEl) playEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      let filterCategory: CategoryFilter = 'All';
      if (currentChapter.category === 'AUDIO') filterCategory = 'Audio';
      else if (
        currentChapter.category === 'GAMING' ||
        currentChapter.category === 'PRECISION'
      )
        filterCategory = 'Gaming';
      else if (currentChapter.category === 'EVERYDAY')
        filterCategory = 'Everyday';

      setFilter(filterCategory);
      const collEl = document.getElementById('collection');
      if (collEl) collEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll listener
  useEffect(() => {
    let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    let travel = 1;
    let storyTop = 0;

    const measureTravel = () => {
      if (!containerRef.current || !stickyRef.current) return;
      travel = Math.max(1, containerRef.current.offsetHeight - stickyRef.current.offsetHeight);
      storyTop = containerRef.current.offsetTop;
    };
    measureTravel();

    const handleScroll = () => {
      const clamped = THREE.MathUtils.clamp((window.scrollY - storyTop) / travel, 0, 1) * totalSteps;
      scrollTargetRef.current = clamped;

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(clamped / totalSteps) * 100}%`;
      }

      const targetIdx = Math.round(clamped);
      setCurrentChapterIdx((prev) => (prev !== targetIdx ? targetIdx : prev));
    };

    const handleResize = () => {
      const isMobile = window.innerWidth <= 800;
      // On mobile: ignore vertical resize events caused by URL bar collapse during scroll
      if (isMobile && lastWidth !== 0 && window.innerWidth === lastWidth) {
        return;
      }
      lastWidth = window.innerWidth;
      measureTravel();
      handleScroll();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [totalSteps]);

  // Intersection observer for visibility optimization
  useEffect(() => {
    if (!stickyRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(stickyRef.current);
    return () => observer.disconnect();
  }, []);

  // Three.js scene initialization
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let active = true;

    let renderer: THREE.WebGLRenderer | null = null;
    let envTexture: THREE.Texture | null = null;
    let animId: number | null = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
      camera.position.set(0, 0, 8.8);
      camera.lookAt(0, 0, 0);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const env = pmrem.fromScene(room, 0.04);
      envTexture = env.texture;
      scene.environment = envTexture;
      room.dispose();
      pmrem.dispose();

      scene.add(new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.55));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
      keyLight.position.set(4, 6, 7);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.1);
      rimLight.position.set(-4, 3, -2);
      scene.add(rimLight);

      let lastW = 0;
      let lastH = 0;
      const resize = () => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const w = Math.round(rect.width);
        const h = Math.round(rect.height);
        if (!w || !h) return;

        const isMobile = window.innerWidth <= 800;
        // On mobile: NEVER resize camera or WebGL buffer when scrolling!
        // URL bar collapse changes height, but phone width stays identical.
        // Only re-run resize if width changes (orientation flip) or first run.
        if (isMobile && lastW !== 0 && w === lastW) {
          return;
        }

        if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return;
        lastW = w;
        lastH = h;
        renderer?.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      resize();

      const draco = new DRACOLoader().setDecoderPath('/assets/draco/').setWorkerLimit(2);
      const loader = new GLTFLoader().setDRACOLoader(draco);

      // Load first model immediately, then progressively load remaining
      const firstProduct = getProduct(chapters[0].id)!;
      loader
        .loadAsync(`/assets/models/${firstProduct.file}.glb?v=3`)
        .then((gltf) => {
          if (!active) return;
          const model = normalizedModel(gltf, 3.4, 'speaker');
          applySpeakerVariant(model.group, speakerVariant);
          heroModelsRef.current.set(0, model);
          scene.add(model.group);

          const mobile = window.innerWidth <= 800;
          const sync = getHeroDesktopSync(camera.aspect);
          const centerX = mobile ? 0.0 : sync.centerX;
          const centerY = mobile ? getProductMobileCenterY(0) : getProductDesktopCenterY(0, sync.centerY);
          const baseSize = mobile ? 0.54 : sync.scaleMultiplier;
          const size = baseSize * (mobile ? getModelMobileScale(0) : getModelDesktopScale(0));
          model.group.scale.setScalar(size);
          model.group.position.set(centerX, centerY, 0);
          const initRot = getProductBaseRotation(0, mobile);
          model.group.rotation.set(initRot.rx, initRot.ry, initRot.rz);
          renderer?.render(scene, camera);

          setLoadedChapters((prev) => (prev.includes(0) ? prev : [...prev, 0]));
          setIs3dReady(true);
          firstModelReadyTime = performance.now();

          // Progressively load remaining 4 chapters
          for (let i = 1; i < chapters.length; i++) {
            const prod = getProduct(chapters[i].id)!;
            if (chapters[i].id === 'keyboard') {
              Promise.all([
                loader.loadAsync(`/assets/models/${prod.file}.glb?v=2`),
                loader.loadAsync('/assets/models/mouse-web.glb?v=2'),
              ])
                .then(([kGltf, mGltf]) => {
                  if (!active) return;
                  const comboGroup = new THREE.Group();

                  const kModel = normalizedModel(kGltf, 3.1);
                  kModel.group.position.set(-0.58, 0, 0);
                  comboGroup.add(kModel.group);

                  const mModel = normalizedModel(mGltf, 1.15);
                  mModel.group.position.set(1.40, -0.04, 0.20);
                  mModel.group.rotation.set(0, 0, 0);
                  comboGroup.add(mModel.group);

                  comboGroup.visible = false;
                  heroModelsRef.current.set(i, {
                    group: comboGroup,
                    content: comboGroup,
                    animations: kGltf.animations,
                  });
                  scene.add(comboGroup);
                  setLoadedChapters((prev) => (prev.includes(i) ? prev : [...prev, i]));
                })
                .catch(() => {});
            } else {
              loader
                .loadAsync(`/assets/models/${prod.file}.glb?v=2`)
                .then((subGltf) => {
                  if (!active) return;
                  const subModel = normalizedModel(subGltf, 3.4, prod.id);
                  subModel.group.visible = false;
                  heroModelsRef.current.set(i, subModel);
                  scene.add(subModel.group);
                  setLoadedChapters((prev) => (prev.includes(i) ? prev : [...prev, i]));
                })
                .catch(() => {});
            }
          }
        })
        .catch(() => {
          if (!active) return;
          setHero3dFailed(true);
        });

      let lastTime = 0;
      let firstModelReadyTime = 0;
      const animate = (time: number) => {
        animId = requestAnimationFrame(animate);
        if (document.hidden || !isVisibleRef.current) return;

        const delta = lastTime === 0 ? 0.016 : Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        scrollPositionRef.current = reduceMotion
          ? scrollTargetRef.current
          : THREE.MathUtils.damp(
              scrollPositionRef.current,
              scrollTargetRef.current,
              10,
              delta
            );

        if (Math.abs(scrollPositionRef.current - scrollTargetRef.current) < 0.0001) {
          scrollPositionRef.current = scrollTargetRef.current;
        }

        const mobile = window.innerWidth <= 800;
        const sync = getHeroDesktopSync(camera.aspect);
        const centerX = mobile ? 0.0 : sync.centerX;

        const idleElapsed = firstModelReadyTime > 0 ? Math.max(0, time - firstModelReadyTime) : 0;
        const idleRamp = Math.min(1, idleElapsed / 2000);

        if (mobile) {
          heroRotationRef.current.y = THREE.MathUtils.damp(heroRotationRef.current.y, 0, 4, delta);
          heroRotationRef.current.x = THREE.MathUtils.damp(heroRotationRef.current.x, 0, 6, delta);
        }

        heroModelsRef.current.forEach((m, i) => {
          const d =
            (reduceMotion
              ? Math.round(scrollPositionRef.current)
              : scrollPositionRef.current) - i;
          const abs = Math.abs(d);
          m.group.visible = abs < 0.99;
          if (!m.group.visible) return;

          // Scale is 100% constant during scroll - products NEVER scale up or down!
          const baseSize = mobile ? 0.54 : sync.scaleMultiplier;
          const size = baseSize * (mobile ? getModelMobileScale(i) : getModelDesktopScale(i));
          const itemCenterY = mobile ? getProductMobileCenterY(i) : getProductDesktopCenterY(i, sync.centerY);
          m.group.scale.setScalar(size);

          // Only products move horizontally across the screen
          m.group.position.set(
            centerX + Math.sin((d * Math.PI) / 2) * (mobile ? 3.1 : 5.0),
            itemCenterY + (reduceMotion ? 0 : Math.sin(idleElapsed * 0.00075 + i) * 0.055 * idleRamp),
            0
          );

          const { rx: baseRx, ry: baseRy, rz: baseRz } = getProductBaseRotation(i, mobile);

          m.group.rotation.set(
            baseRx + heroRotationRef.current.x,
            baseRy +
              d * 0.75 +
              heroRotationRef.current.y +
              (reduceMotion ? 0 : Math.sin(idleElapsed * 0.0003 + i) * 0.035 * idleRamp),
            baseRz
          );
        });

        renderer?.render(scene, camera);
      };

      animId = requestAnimationFrame(animate);

      return () => {
        active = false;
        if (animId) cancelAnimationFrame(animId);
        resizeObserver.disconnect();
        envTexture?.dispose();
        renderer?.dispose();
        draco.dispose();
      };
    } catch {
      setHero3dFailed(true);
    }
  }, []);

  // Pointer drag and arrow key interaction
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    let down = true;
    let startX = e.clientX;
    let startY = e.clientY;
    let lastX = e.clientX;
    let lastY = e.clientY;
    const isTouch = e.pointerType === 'touch';
    let isHorizontalDrag = false;

    if (!isTouch) {
      el.setPointerCapture(e.pointerId);
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (!down) return;
      const totalDx = ev.clientX - startX;
      const totalDy = ev.clientY - startY;

        if (isTouch) {
        // On touch / mobile:
        // If the gesture is vertical scroll, release immediately so native scroll is 100% stable
        if (!isHorizontalDrag && Math.abs(totalDy) > 4 && Math.abs(totalDy) >= Math.abs(totalDx)) {
          down = false;
          el.removeEventListener('pointermove', onPointerMove);
          el.removeEventListener('pointerup', onPointerUp);
          el.removeEventListener('pointercancel', onPointerUp);
          return;
        }
        if (Math.abs(totalDx) > 8 && Math.abs(totalDx) > Math.abs(totalDy)) {
          isHorizontalDrag = true;
        }
        if (!isHorizontalDrag) return;

        const dx = ev.clientX - lastX;
        heroRotationRef.current.y += dx * 0.006;
        lastX = ev.clientX;
        lastY = ev.clientY;
        return;
      }

      // Desktop mouse drag
      const dx = ev.clientX - lastX;
      const dy = ev.clientY - lastY;
      heroRotationRef.current.y += dx * 0.008;
      heroRotationRef.current.x = THREE.MathUtils.clamp(
        heroRotationRef.current.x + dy * 0.004,
        -0.55,
        0.6
      );
      lastX = ev.clientX;
      lastY = ev.clientY;
    };

    const onPointerUp = () => {
      down = false;
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };

    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      if (e.key === 'ArrowLeft') heroRotationRef.current.y -= 0.15;
      if (e.key === 'ArrowRight') heroRotationRef.current.y += 0.15;
      if (e.key === 'ArrowUp') heroRotationRef.current.x -= 0.1;
      if (e.key === 'ArrowDown') heroRotationRef.current.x += 0.1;
    }
  };

  const isModelLoaded = heroModelsRef.current.has(currentChapterIdx);

  return (
    <section
      ref={containerRef}
      className="scroll-story"
      id="experience"
      aria-label={`Scroll through ${chapters.length} product stories`}
    >
      <div
        ref={stickyRef}
        className="story-sticky"
        style={
          {
            '--story-accent': currentChapter.accent,
          } as React.CSSProperties
        }
      >
        <div className="hero-bg-stage" aria-hidden="true">
          <picture>
            <source
              media="(max-width: 800px)"
              srcSet="/assets/hero-bg-mobile.jpg"
            />
            <img
              src="/assets/hero-bg-desktop.png"
              alt=""
              className="hero-bg-image"
              loading="eager"
            />
          </picture>
          <div className="hero-bg-overlay"></div>
        </div>
        <div className="ambient ambient-one"></div>
        <div className="ambient ambient-two"></div>
        <div className="stage-grid" aria-hidden="true"></div>
        <div className="stage-orbit orbit-one" aria-hidden="true"></div>
        <div className="stage-orbit orbit-two" aria-hidden="true"></div>
        <div className="giant-word" aria-hidden="true">
          DEAL DRIP
        </div>

        <canvas ref={canvasRef} id="hero-canvas" aria-hidden="true"></canvas>

        {!hero3dFailed && (
          <div
            className={`hero-loader ${is3dReady ? 'hero-loader-hidden' : ''}`}
            aria-hidden={is3dReady}
            aria-label="Loading interactive 3D model"
          >
            <div className="hero-loader-backdrop"></div>
            <div className="hero-loader-card">
              <div className="hero-loader-spinner" aria-hidden="true">
                <div className="loader-orbit orbit-cyan"></div>
                <div className="loader-orbit orbit-lime"></div>
                <div className="loader-pulse-dot"></div>
              </div>
              <div className="hero-loader-info">
                <span className="hero-loader-badge">DEAL DRIP 3D</span>
                <div className="hero-loader-status">
                  <span className="loader-status-text">INITIALIZING SCENE</span>
                  <span className="loader-status-dots" aria-hidden="true">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!hero3dFailed && (
          <div
            className="drag-zone"
            id="hero-drag"
            tabIndex={0}
            role="img"
            aria-label="Interactive product. Drag left or right, or use arrow keys to rotate."
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
          ></div>
        )}

        <div className="story-copy">
          <div className="eyebrow">
            <span className="small-line"></span>
            <span id="story-eyebrow">{currentChapter.eyebrow}</span>
          </div>
          <h1
            id="story-title"
            dangerouslySetInnerHTML={{ __html: currentChapter.title }}
          />
          <p className="story-description" id="story-description">
            {currentChapter.description}
          </p>
          <div className="story-actions">
            <button className="button button-lime" onClick={handleCtaClick}>
              {currentChapter.cta}
              {!currentChapter.cta.includes('↓') && !currentChapter.cta.includes('→') && (
                <span className="button-spark" aria-hidden="true">
                  {' '}✳
                </span>
              )}
            </button>
            <button
              className="text-button"
              id="hero-quickview"
              onClick={() =>
                openQuickview(
                  currentChapter.id,
                  currentChapter.id === 'speaker' ? speakerVariant : undefined
                )
              }
            >
              A closer look <span aria-hidden="true">+</span>
            </button>
          </div>
          <div className="story-note">
            <span className="outlined-cube" aria-hidden="true">
              ◇
            </span>
            <span>Real products. Every angle.</span>
          </div>
        </div>

        <div className="side-chapters" aria-label="Product chapters">
          {chapters.map((ch, idx) => (
            <button
              key={ch.id}
              className={idx === currentChapterIdx ? 'active' : ''}
              onClick={() => goToChapter(idx)}
              aria-label={`Chapter ${idx + 1}: ${ch.category}`}
              aria-current={idx === currentChapterIdx ? 'step' : undefined}
            >
              <span>{String(idx + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>

        <div className="product-caption">
          <span className="caption-kicker">{currentChapter.kicker}</span>
          <div>
            <span>{currentProduct.name}</span>
            <button
              onClick={() =>
                openQuickview(
                  currentChapter.id,
                  currentChapter.id === 'speaker' ? speakerVariant : undefined
                )
              }
              aria-label={`View featured product ${currentProduct.name}`}
            >
              +
            </button>
          </div>
        </div>

        <div className="rotate-hint">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 8a7 7 0 1 0 1 7M18 3v5h-5" />
          </svg>
          <span id="rotate-label">
            {hero3dFailed ? 'Explore the collection' : 'Drag to explore'}
          </span>
        </div>

        <div className="story-bottom">
          <div className="scroll-cue">
            <span className="scroll-line"></span>
            <span>SCROLL TO DISCOVER</span>
          </div>
          <div className="chapter-name">
            <span>{currentChapter.category}</span>
            <span className="divider"></span>
            <span>
              {String(currentChapterIdx + 1).padStart(2, '0')} /{' '}
              {String(chapters.length).padStart(2, '0')}
            </span>
          </div>
          <span className="bottom-coordinate">DESIGNED FOR YOUR WORLD</span>
        </div>

        <div className="story-progress">
          <span ref={progressBarRef} style={{ width: '0%' }}></span>
        </div>
      </div>
    </section>
  );
}
