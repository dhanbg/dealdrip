'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useStore } from '@/context/StoreContext';

interface KeyResolution {
  clipName: string;
  feedbackLabel: string;
  charToInsert?: string;
}

const SYMBOL_MAP: Record<string, string> = {
  ' ': 'Space',
  '-': 'Minus',
  '_': 'Minus',
  '=': 'Equal',
  '+': 'Equal',
  '[': 'BracketLeft',
  '{': 'BracketLeft',
  ']': 'BracketRight',
  '}': 'BracketRight',
  '\\': 'Backslash',
  '|': 'Backslash',
  ';': 'Semicolon',
  ':': 'Semicolon',
  "'": 'Quote',
  '"': 'Quote',
  ',': 'Comma',
  '<': 'Comma',
  '.': 'Period',
  '>': 'Period',
  '/': 'Slash',
  '?': 'Slash',
  '`': 'Backquote',
  '~': 'Backquote',
  '!': 'Digit1',
  '@': 'Digit2',
  '#': 'Digit3',
  '$': 'Digit4',
  '%': 'Digit5',
  '^': 'Digit6',
  '&': 'Digit7',
  '*': 'Digit8',
  '(': 'Digit9',
  ')': 'Digit0',
};

function resolveKeyAction(code?: string, key?: string): KeyResolution | null {
  const safeCode = code || '';
  const safeKey = key && key !== 'Unidentified' ? key : '';

  // 1. Check code first if valid (physical keyboard or 3D mesh name)
  if (safeCode) {
    if (safeCode.startsWith('Key')) {
      const letter = safeCode.substring(3).toUpperCase();
      return { clipName: `Press_${letter}`, feedbackLabel: letter, charToInsert: letter.toLowerCase() };
    }
    if (safeCode.startsWith('Digit')) {
      const num = safeCode.substring(5);
      return { clipName: `Press_${safeCode}`, feedbackLabel: num, charToInsert: num };
    }
    if (safeCode === 'Space') {
      return { clipName: 'Press_Space', feedbackLabel: 'SPACE', charToInsert: ' ' };
    }
    if (safeCode === 'Backspace') {
      return { clipName: 'Press_Backspace', feedbackLabel: 'BACKSPACE' };
    }
    if (safeCode === 'Enter' || safeCode === 'NumpadEnter') {
      return { clipName: 'Press_Enter', feedbackLabel: 'ENTER' };
    }
    if (safeCode === 'Tab') {
      return { clipName: 'Press_Tab', feedbackLabel: 'TAB' };
    }
    if (safeCode === 'Escape') {
      return { clipName: 'Press_Escape', feedbackLabel: 'ESC' };
    }
    if (safeCode.startsWith('Numpad') && /^Numpad[0-9]$/.test(safeCode)) {
      const num = safeCode.substring(6);
      return { clipName: `Press_${safeCode}`, feedbackLabel: num, charToInsert: num };
    }

    const namedKeys = [
      'Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Backslash',
      'Semicolon', 'Quote', 'Backquote', 'Comma', 'Period', 'Slash',
      'CapsLock', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
      'AltLeft', 'AltRight', 'MetaLeft', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
    ];
    if (namedKeys.includes(safeCode)) {
      return { clipName: `Press_${safeCode}`, feedbackLabel: safeCode.toUpperCase() };
    }
  }

  // 2. Character-based check (crucial for mobile virtual keyboards)
  if (safeKey) {
    if (/^[a-zA-Z]$/.test(safeKey)) {
      const upper = safeKey.toUpperCase();
      return { clipName: `Press_${upper}`, feedbackLabel: upper, charToInsert: safeKey };
    }
    if (/^[0-9]$/.test(safeKey)) {
      return { clipName: `Press_Digit${safeKey}`, feedbackLabel: safeKey, charToInsert: safeKey };
    }
    if (safeKey === ' ' || safeKey === 'Space') {
      return { clipName: 'Press_Space', feedbackLabel: 'SPACE', charToInsert: ' ' };
    }
    if (safeKey === 'Backspace') {
      return { clipName: 'Press_Backspace', feedbackLabel: 'BACKSPACE' };
    }
    if (safeKey === 'Enter') {
      return { clipName: 'Press_Enter', feedbackLabel: 'ENTER' };
    }
    if (safeKey === 'Tab') {
      return { clipName: 'Press_Tab', feedbackLabel: 'TAB' };
    }
    if (safeKey === 'Escape' || safeKey === 'Esc') {
      return { clipName: 'Press_Escape', feedbackLabel: 'ESC' };
    }
    if (SYMBOL_MAP[safeKey]) {
      const animName = SYMBOL_MAP[safeKey];
      return { clipName: `Press_${animName}`, feedbackLabel: safeKey, charToInsert: safeKey };
    }
  }

  return null;
}

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

const QUICK_TEST_KEYS = [
  { label: 'W', code: 'KeyW', key: 'W' },
  { label: 'A', code: 'KeyA', key: 'A' },
  { label: 'S', code: 'KeyS', key: 'S' },
  { label: 'D', code: 'KeyD', key: 'D' },
  { label: 'SPACE', code: 'Space', key: ' ' },
  { label: '1', code: 'Digit1', key: '1' },
  { label: '2', code: 'Digit2', key: '2' },
  { label: '3', code: 'Digit3', key: '3' },
  { label: 'ENTER', code: 'Enter', key: 'Enter' },
  { label: '⌫ DEL', code: 'Backspace', key: 'Backspace' },
];

export function KeyboardDemo3D() {
  const { openQuickview } = useStore();
  const [keyFeedback, setKeyFeedback] = useState('Your keyboard is the controller.');
  const [modelReady, setModelReady] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVisibleRef = useRef(false);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const modelRef = useRef<any>(null);
  const comboGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Avoid duplicate triggers across keydown + beforeinput + onChange
  const lastKeyHandledRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });
  const pointerStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  const triggerKeyAction = useCallback((res: KeyResolution) => {
    if (!modelRef.current || !mixerRef.current) return;

    const clip = modelRef.current.animations?.find(
      (a: THREE.AnimationClip) => a.name === res.clipName
    );

    if (clip) {
      const action = mixerRef.current.clipAction(clip);
      action.reset().setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = false;
      action.timeScale = 1.25;
      action.play();
    }

    setKeyFeedback(`Last key · ${res.feedbackLabel}`);
  }, []);

  const playKey = useCallback((code: string, key: string) => {
    const action = resolveKeyAction(code, key);
    if (action) {
      triggerKeyAction(action);
    }
  }, [triggerKeyAction]);

  // Global typing listener when keyboard section is in view
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return; // Handled by input element directly
      }
      if (!isVisibleRef.current) return;
      if (e.repeat) return;

      const action = resolveKeyAction(e.code, e.key);
      if (action) {
        triggerKeyAction(action);
        if (action.charToInsert) {
          setInputValue((prev) => (prev + action.charToInsert).slice(0, 48));
        } else if (action.clipName === 'Press_Backspace') {
          setInputValue((prev) => prev.slice(0, -1));
        }
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [triggerKeyAction]);

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
      renderer.toneMappingExposure = 1.25;
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
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

      scene.add(new THREE.HemisphereLight(0xffffff, 0x2c3548, 0.88));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.35);
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

      loader
        .loadAsync('/assets/models/twolf-tf200-keyboard-web.glb?v=3')
        .then((keyboardGltf) => {
          if (!active) return;

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

  // Direct 3D keyboard tap handling
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const dt = Date.now() - pointerStartRef.current.time;

    // Distinguish between a quick tap and a scroll drag gesture
    if (dx > 14 || dy > 14 || dt > 450) return;

    if (!canvasRef.current || !cameraRef.current || !modelRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(modelRef.current.content.children, true);
    if (intersects.length > 0) {
      let node: THREE.Object3D | null = intersects[0].object;
      let keyName = '';
      while (node && node !== modelRef.current.content) {
        if (node.name && node.name.startsWith('Key_')) {
          keyName = node.name.substring(4);
          break;
        } else if (
          node.name &&
          (node.name.startsWith('Cap_') ||
            node.name.startsWith('Switch_') ||
            node.name.startsWith('Backlight_'))
        ) {
          keyName = node.name.split('_')[1];
          break;
        }
        node = node.parent;
      }

      if (keyName) {
        const action = resolveKeyAction(keyName, keyName);
        if (action) {
          triggerKeyAction(action);
          if (action.charToInsert) {
            setInputValue((prev) => (prev + action.charToInsert).slice(0, 48));
          } else if (action.clipName === 'Press_Backspace') {
            setInputValue((prev) => prev.slice(0, -1));
          }
        }
      }
    }
  }, [triggerKeyAction]);

  // Input event handlers for desktop & mobile
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.repeat) return;

    // On mobile virtual keyboards, e.key is often 'Unidentified' and e.keyCode is 229
    if (e.key && e.key !== 'Unidentified' && e.keyCode !== 229) {
      const action = resolveKeyAction(e.code, e.key);
      if (action) {
        triggerKeyAction(action);
        const id = (e.key === 'Backspace' ? 'backspace' : e.key).toLowerCase();
        lastKeyHandledRef.current = { id, time: Date.now() };
      }
    }
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    if (!nativeEvent) return;

    if (nativeEvent.inputType === 'insertText' && nativeEvent.data) {
      const char = nativeEvent.data.slice(-1);
      const isRecent =
        Date.now() - lastKeyHandledRef.current.time < 120 &&
        lastKeyHandledRef.current.id === char.toLowerCase();

      if (!isRecent) {
        const action = resolveKeyAction('', char);
        if (action) {
          triggerKeyAction(action);
          lastKeyHandledRef.current = { id: char.toLowerCase(), time: Date.now() };
        }
      }
    } else if (nativeEvent.inputType === 'deleteContentBackward') {
      const isRecent =
        Date.now() - lastKeyHandledRef.current.time < 120 &&
        lastKeyHandledRef.current.id === 'backspace';

      if (!isRecent) {
        const action = resolveKeyAction('Backspace', 'Backspace');
        if (action) {
          triggerKeyAction(action);
          lastKeyHandledRef.current = { id: 'backspace', time: Date.now() };
        }
      }
    } else if (nativeEvent.inputType === 'insertLineBreak') {
      const action = resolveKeyAction('Enter', 'Enter');
      if (action) {
        triggerKeyAction(action);
        lastKeyHandledRef.current = { id: 'enter', time: Date.now() };
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const prevVal = inputValue;
    setInputValue(newVal);

    if (newVal.length > prevVal.length) {
      const addedText = newVal.slice(prevVal.length);
      const lastChar = addedText.slice(-1);
      const isRecent =
        Date.now() - lastKeyHandledRef.current.time < 120 &&
        lastKeyHandledRef.current.id === lastChar.toLowerCase();

      if (!isRecent) {
        const action = resolveKeyAction('', lastChar);
        if (action) {
          triggerKeyAction(action);
          lastKeyHandledRef.current = { id: lastChar.toLowerCase(), time: Date.now() };
        }
      }
    } else if (newVal.length < prevVal.length) {
      const isRecent =
        Date.now() - lastKeyHandledRef.current.time < 120 &&
        lastKeyHandledRef.current.id === 'backspace';

      if (!isRecent) {
        const action = resolveKeyAction('Backspace', 'Backspace');
        if (action) {
          triggerKeyAction(action);
          lastKeyHandledRef.current = { id: 'backspace', time: Date.now() };
        }
      }
    }
  };

  const handleChipPress = (chip: { code: string; key: string }) => {
    const action = resolveKeyAction(chip.code, chip.key);
    if (action) {
      triggerKeyAction(action);
      if (action.charToInsert) {
        setInputValue((prev) => (prev + action.charToInsert).slice(0, 48));
      } else if (action.clipName === 'Press_Backspace') {
        setInputValue((prev) => prev.slice(0, -1));
      }
    }
  };

  const handleInputFocus = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 800) {
      setTimeout(() => {
        canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 250);
    }
  };

  return (
    <section ref={sectionRef} className="keyboard-section" id="play">
      <div className="keyboard-header reveal">
        <span className="eyebrow">TRY IT YOURSELF</span>
        <h2>
          Make it<br />
          <em>click.</em>
        </h2>
        <p>
          Type on your keyboard or tap keys directly to watch the TF200 animate in 3D in real time.
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
            aria-label="Interactive 3D keyboard. Tap keys or type to interact."
            onPointerDown={handleCanvasPointerDown}
            onPointerUp={handleCanvasPointerUp}
            style={{
              opacity: modelReady ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          ></canvas>
          <div className="stage-tap-hint">
            <span aria-hidden="true">✦</span> Tap 3D keys directly or type below
          </div>
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
              ref={inputRef}
              id="keyboard-input"
              maxLength={48}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              inputMode="text"
              enterKeyHint="done"
              placeholder="Tap here to type in 3D..."
              value={inputValue}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              onBeforeInput={handleBeforeInput}
              onChange={handleChange}
            />
            {inputValue && (
              <button
                type="button"
                className="typing-clear-btn"
                onClick={() => setInputValue('')}
                aria-label="Clear input text"
                title="Clear"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick-tap key chips for easy touch & testing */}
          <div className="keyboard-quick-chips" aria-label="Quick test keys">
            <span className="chips-label">Quick keys:</span>
            {QUICK_TEST_KEYS.map((k) => (
              <button
                key={k.label}
                type="button"
                className="key-chip"
                onClick={() => handleChipPress(k)}
              >
                {k.label}
              </button>
            ))}
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
