'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { chapters, getProduct, getPreviewUrl, Product } from '@/data/catalog';
import { useStore, CategoryFilter } from '@/context/StoreContext';

function normalizedModel(gltf: any, size = 3.4) {
  const content = gltf.scene.clone(true);

  // Gently deepen the speaker fabric so it has a rich heather grey tone matching the product photo
  content.traverse((child: any) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m: any) => {
        if (
          m.name === 'Dark enlarged woven fabric' ||
          (child.name && child.name.includes('92eb65'))
        ) {
          if (m.color) m.color.setRGB(0.50, 0.51, 0.53);
          m.roughness = 0.88;
          m.needsUpdate = true;
        }
      });
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
      // Speaker & charging dock: slope towards ourselves matching mobile angle, straight forward
      return { rx: mobile ? 0.08 : 0.21, ry: 0.0, rz: 0.0 };
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
  const { openQuickview, setFilter } = useStore();
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [hero3dFailed, setHero3dFailed] = useState(false);
  const [loadedChapters, setLoadedChapters] = useState<number[]>([]);
  const [isFallbackForced, setIsFallbackForced] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fallback')) {
      setIsFallbackForced(true);
    }
  }, []);

  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);

  const heroModelsRef = useRef<Map<number, any>>(new Map());
  const heroRotationRef = useRef({ x: 0, y: 0 });
  const scrollTargetRef = useRef(0);
  const scrollPositionRef = useRef(0);
  const isVisibleRef = useRef(true);

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
    const handleScroll = () => {
      if (!containerRef.current || !stickyRef.current) return;
      const story = containerRef.current;
      const travel = Math.max(1, story.offsetHeight - stickyRef.current.offsetHeight);
      const clamped = THREE.MathUtils.clamp((window.scrollY - story.offsetTop) / travel, 0, 1) * totalSteps;
      scrollTargetRef.current = clamped;

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(clamped / totalSteps) * 100}%`;
      }

      const targetIdx = Math.round(clamped);
      setCurrentChapterIdx((prev) => (prev !== targetIdx ? targetIdx : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
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
      const loader = new GLTFLoader().setDRACOLoader(draco);

      // Load first model immediately, then progressively load remaining
      const firstProduct = getProduct(chapters[0].id)!;
      loader
        .loadAsync(`/assets/models/${firstProduct.file}.glb?v=3`)
        .then((gltf) => {
          if (!active) return;
          const model = normalizedModel(gltf);
          heroModelsRef.current.set(0, model);
          scene.add(model.group);

          const mobile = window.innerWidth <= 800;
          const short = window.innerHeight < 740;
          const sync = getHeroDesktopSync(camera.aspect);
          const centerX = mobile ? 0.0 : sync.centerX;
          const centerY = mobile ? getProductMobileCenterY(0) : getProductDesktopCenterY(0, sync.centerY);
          const baseSize = mobile ? (short ? 0.45 : 0.58) : sync.scaleMultiplier;
          const size = baseSize * (mobile ? getModelMobileScale(0) : getModelDesktopScale(0));
          model.group.scale.setScalar(size);
          model.group.position.set(centerX, centerY, 0);
          const initRot = getProductBaseRotation(0, mobile);
          model.group.rotation.set(initRot.rx, initRot.ry, initRot.rz);
          renderer?.render(scene, camera);

          setLoadedChapters((prev) => (prev.includes(0) ? prev : [...prev, 0]));
          if (fallbackRef.current && !isFallbackForced) fallbackRef.current.hidden = true;
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
                  const subModel = normalizedModel(subGltf);
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
          if (fallbackRef.current) fallbackRef.current.hidden = false;
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
        const short = window.innerHeight < 740;
        const sync = getHeroDesktopSync(camera.aspect);
        const centerX = mobile ? 0.0 : sync.centerX;
        const centerY = mobile ? -1.040 : sync.centerY;

        const idleElapsed = firstModelReadyTime > 0 ? Math.max(0, time - firstModelReadyTime) : 0;
        const idleRamp = Math.min(1, idleElapsed / 2000);

        heroModelsRef.current.forEach((m, i) => {
          const d =
            (reduceMotion
              ? Math.round(scrollPositionRef.current)
              : scrollPositionRef.current) - i;
          const abs = Math.abs(d);
          m.group.visible = abs < 0.94;
          if (!m.group.visible) return;

          const baseSize = (mobile ? (short ? 0.45 : 0.58) : sync.scaleMultiplier) * (1 - abs * 0.34);
          const size = baseSize * (mobile ? getModelMobileScale(i) : getModelDesktopScale(i));
          const itemCenterY = mobile ? getProductMobileCenterY(i) : getProductDesktopCenterY(i, sync.centerY);
          m.group.scale.setScalar(size);
          m.group.position.set(
            centerX + Math.sin((d * Math.PI) / 2) * (mobile ? 3.9 : 5),
            itemCenterY - abs * 0.2 + (reduceMotion ? 0 : Math.sin(idleElapsed * 0.00075 + i) * 0.055 * idleRamp),
            -abs * 1.2
          );

          const { rx: baseRx, ry: baseRy, rz: baseRz } = getProductBaseRotation(i, mobile);

          m.group.rotation.set(
            baseRx + heroRotationRef.current.x,
            baseRy +
              d * 1.05 +
              heroRotationRef.current.y +
              (reduceMotion ? 0 : Math.sin(idleElapsed * 0.0003 + i) * 0.035 * idleRamp),
            baseRz + abs * 0.08
          );
        });

        if (typeof window !== 'undefined' && (window as any).__heroForceFallback !== undefined) {
          if (fallbackRef.current) fallbackRef.current.hidden = !(window as any).__heroForceFallback;
        } else {
          const target = Math.round(scrollPositionRef.current);
          if (fallbackRef.current) {
            fallbackRef.current.hidden = !isFallbackForced && heroModelsRef.current.has(target);
          }
        }
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
    let lastX = e.clientX;
    let lastY = e.clientY;
    if (e.pointerType === 'mouse') el.setPointerCapture(e.pointerId);

    const onPointerMove = (ev: PointerEvent) => {
      if (!down) return;
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

        <div
          ref={fallbackRef}
          className="hero-fallback"
          hidden={!isFallbackForced && loadedChapters.includes(currentChapterIdx) && !hero3dFailed}
        >
          {currentChapterIdx === 0 ? (
            <picture>
              <source
                media="(max-width: 800px)"
                srcSet="/assets/previews/speaker-hero-mobile.png?v=7"
              />
              <img
                src="/assets/previews/speaker-hero-cutout.png?v=7"
                alt={currentProduct.name}
              />
            </picture>
          ) : (
            <img
              src={getPreviewUrl(currentProduct)}
              alt={currentProduct.name}
              className="hero-fallback-product-img"
            />
          )}
        </div>

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
              onClick={() => openQuickview(currentChapter.id)}
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
              onClick={() => openQuickview(currentChapter.id)}
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
