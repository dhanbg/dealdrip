'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useStore } from '@/context/StoreContext';

function normalizedModel(gltf: any, size = 4.4) {
  const content = gltf.scene.clone(true);

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

export function KeyboardDemo3D() {
  const { openQuickview } = useStore();
  const [keyFeedback, setKeyFeedback] = useState('Your keyboard is the controller.');
  const [modelReady, setModelReady] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisibleRef = useRef(false);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<any>(null);
  const comboGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const playKey = useCallback((code: string, key: string) => {
    if (!modelRef.current || !mixerRef.current) return;

    let name = code || key;
    if (name.startsWith('Key')) name = name.substring(3);
    if (!code && /^[a-z]$/i.test(key)) name = key.toUpperCase();

    const clip = modelRef.current.animations?.find(
      (a: THREE.AnimationClip) => a.name === 'Press_' + name
    );

    if (clip) {
      const action = mixerRef.current.clipAction(clip);
      action.reset().setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = false;
      action.timeScale = 1.2;
      action.play();
    }

    setKeyFeedback('Last key · ' + (key === ' ' ? 'SPACE' : key.toUpperCase()));
  }, []);


  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { rootMargin: '150px' }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

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
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
      // Realistic typing desk viewpoint: elevated and looking down towards the keyboard
      camera.position.set(0, 3.75, 4.3);
      camera.lookAt(0, -0.05, 0);
      cameraRef.current = camera;

      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const env = pmrem.fromScene(room, 0.04);
      envTexture = env.texture;
      scene.environment = envTexture;
      room.dispose();
      pmrem.dispose();

      scene.add(new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.65));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
      keyLight.position.set(3, 7, 5);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.2);
      rimLight.position.set(-3, 4, -2);
      scene.add(rimLight);

      const comboGroup = new THREE.Group();
      scene.add(comboGroup);
      comboGroupRef.current = comboGroup;

      const resize = () => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        renderer?.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / rect.height;

        const isMobile = window.innerWidth <= 800;
        // On mobile, zoom out so the keyboard never gets cropped at left/right edges
        // aspect ratio on mobile portrait is typically 0.6 - 1.1
        const scale = isMobile
          ? Math.min(0.72, Math.max(0.50, camera.aspect * 0.66))
          : Math.min(1.05, Math.max(0.85, (rect.width / 820) * 0.98));
        comboGroup.scale.setScalar(scale);
        camera.updateProjectionMatrix();
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
      resize();

      const draco = new DRACOLoader().setDecoderPath('/assets/draco/').setWorkerLimit(2);
      const loader = new GLTFLoader().setDRACOLoader(draco);

      // Load TF200 Keyboard model for interactive typing
      loader
        .loadAsync('/assets/models/twolf-tf200-keyboard-web.glb?v=3')
        .then((keyboardGltf) => {
          if (!active) return;

          // Keyboard: perfectly straight facing the user (ry = 0, rz = 0), sloped upwards toward monitor (rx > 0)
          // Generously scaled to zoom in without clipping edges
          const keyboardModel = normalizedModel(keyboardGltf, 4.8);
          keyboardModel.group.rotation.set(0.35, 0.0, 0.0);
          keyboardModel.group.position.set(0, -0.05, 0);
          comboGroup.add(keyboardModel.group);
          modelRef.current = keyboardModel;
          mixerRef.current = new THREE.AnimationMixer(keyboardModel.content);

          setModelReady(true);
        })
        .catch(() => {
          if (!active) return;
          setKeyFeedback('Explore the TF200 in the collection.');
        });

      let lastTime = 0;
      const animate = (time: number) => {
        animId = requestAnimationFrame(animate);
        if (document.hidden || !isVisibleRef.current) return;

        const delta = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        mixerRef.current?.update(delta);
        if (comboGroupRef.current && !reduceMotion) {
          comboGroupRef.current.position.y = Math.sin(time * 0.00055) * 0.04;
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
      setKeyFeedback('Explore the TF200 in the collection.');
    }
  }, []);

  return (
    <section ref={sectionRef} className="keyboard-section" id="play">
      <div className="keyboard-header reveal">
        <span className="eyebrow">TRY IT YOURSELF</span>
        <h2>
          Make it<br />
          <em>click.</em>
        </h2>
        <p>
          Type on your keyboard and watch the keys animate in 3D in real time.
        </p>
      </div>

      <div className="keyboard-stage-container">
        <div className="keyboard-stage">
          <span className="demo-index">OBJECT 03 / PLAY · TF200</span>
          <div className="keyboard-glow"></div>
          <img
            id="keyboard-poster"
            src="/assets/previews/twolf-tf200-keyboard-solo.png"
            alt="TWOLF TF200 keyboard with colorful illuminated keys"
            loading="lazy"
            style={{ display: modelReady ? 'none' : 'block' }}
          />
          <canvas
            ref={canvasRef}
            id="keyboard-canvas"
            aria-label="Interactive 3D keyboard. Type to interact."
            style={{
              opacity: modelReady ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          ></canvas>
          <div className="keyboard-stage-bottom">
            <span>TF200 KEYBOARD</span>
            <span>
              105 ANIMATIONS.<br />
              SUSPENDED RAINBOW KEYS.
            </span>
          </div>
        </div>

        {/* Input box placed directly below the 3D keyboard */}
        <div className="keyboard-interactive-bar">
          <label htmlFor="keyboard-input">Type on your keyboard to test:</label>
          <div className="typing-field">
            <input
              id="keyboard-input"
              maxLength={48}
              autoComplete="off"
              spellCheck="false"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (!e.repeat) {
                  playKey(e.code, e.key);
                }
              }}
            />
          </div>
          <div className="key-feedback" id="key-feedback" aria-live="polite">
            {keyFeedback}
          </div>

          <button
            className="button button-outline"
            onClick={() => openQuickview('keyboard')}
          >
            Meet the TF200 Combo <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>
    </section>
  );
}
