"use client";

import { useEffect, useRef, useState } from "react";
import sheet1 from "@/assets/sheet-1.jpg.asset.json";
import sheet2 from "@/assets/sheet-2.jpg.asset.json";
import sheet3 from "@/assets/sheet-3.jpg.asset.json";
import sheet4 from "@/assets/sheet-4.jpg.asset.json";
import sheet5 from "@/assets/sheet-5.jpg.asset.json";
import sheet6 from "@/assets/sheet-6.jpg.asset.json";
import m1 from "@/assets/msheet-1.jpg.asset.json";
import m2 from "@/assets/msheet-2.jpg.asset.json";
import m3 from "@/assets/msheet-3.jpg.asset.json";
import m4 from "@/assets/msheet-4.jpg.asset.json";
import m5 from "@/assets/msheet-5.jpg.asset.json";
import m6 from "@/assets/msheet-6.jpg.asset.json";
import m7 from "@/assets/msheet-7.jpg.asset.json";
import m8 from "@/assets/msheet-8.jpg.asset.json";
import { useIsMobile } from "@/hooks/use-mobile";

const DESKTOP = {
  sheets: [sheet1, sheet2, sheet3, sheet4, sheet5, sheet6].map((s) => s.url),
  frameW: 640,
  frameH: 360,
  cols: 5,
  rows: 10,
  total: 300,
};

const MOBILE = {
  sheets: [m1, m2, m3, m4, m5, m6, m7, m8].map((s) => s.url),
  frameW: 270,
  frameH: 480,
  cols: 8,
  rows: 5,
  total: 300,
};

export const TOTAL_FRAMES = DESKTOP.total;

type Props = {
  /** 0..1 scroll progress driving the frame index */
  progressRef: React.MutableRefObject<number>;
  onReady?: (loaded: number, total: number) => void;
};

export function ScrollSequence({ progressRef, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const cfg = isMobile ? MOBILE : DESKTOP;
    const perSheet = cfg.cols * cfg.rows;
    let cancelled = false;
    let loaded = 0;
    const imgs: HTMLImageElement[] = [];

    // Staged loading: Load first 2 sheets immediately for instant hero rendering, then cascade remaining sheets
    const loadSheet = (i: number) => {
      if (cancelled || imgs[i] || i >= cfg.sheets.length) return;
      const img = new Image();
      img.decoding = "async";
      img.src = cfg.sheets[i];
      img.onload = () => {
        if (cancelled) return;
        loaded += 1;
        onReady?.(loaded, cfg.sheets.length);
        draw();
        // Cascade load next sheet
        if (i + 2 < cfg.sheets.length) {
          loadSheet(i + 2);
        }
      };
      img.onerror = () => {
        if (cancelled) return;
        // Continue loading remaining sheets even if one fails
        if (i + 2 < cfg.sheets.length) {
          loadSheet(i + 2);
        }
      };
      imgs[i] = img;
    };

    // Start with the first two critical sheets
    loadSheet(0);
    if (cfg.sheets.length > 1) {
      loadSheet(1);
    }

    imagesRef.current = imgs;

    let raf = 0;
    let lastFrame = -1;

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      const p = Math.min(Math.max(progressRef.current, 0), 1);
      const frame = Math.min(cfg.total - 1, Math.round(p * (cfg.total - 1)));
      const sheetIndex = Math.floor(frame / perSheet);
      const img = imagesRef.current[sheetIndex];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const within = frame % perSheet;
      const sx = (within % cfg.cols) * cfg.frameW;
      const sy = Math.floor(within / cfg.cols) * cfg.frameH;

      // object-fit: cover
      const scale = Math.max((w * dpr) / cfg.frameW, (h * dpr) / cfg.frameH);
      const dw = cfg.frameW * scale;
      const dh = cfg.frameH * scale;
      const dx = (w * dpr - dw) / 2;
      const dy = (h * dpr - dh) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, sx, sy, cfg.frameW, cfg.frameH, dx, dy, dw, dh);
      lastFrame = frame;
    }

    function loop() {
      const p = Math.min(Math.max(progressRef.current, 0), 1);
      const frame = Math.round(p * (cfg.total - 1));
      if (frame !== lastFrame) draw();
      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    const onResize = () => draw();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [onReady, progressRef, isMobile]);

  useEffect(() => {
    if (reducedMotion) progressRef.current = 0.35;
  }, [reducedMotion, progressRef]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
}
