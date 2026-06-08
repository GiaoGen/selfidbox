"use client";

import { useEffect, useRef, useCallback } from "react";

/* ================================================================== */
/*  Mock words — 20~30 items                                           */
/* ================================================================== */

const MOCK_WORDS = [
  { label: "INFP", count: 8 },
  { label: "猫猫党", count: 6 },
  { label: "海王星", count: 5 },
  { label: "太阳", count: 7 },
  { label: "To Hebe", count: 4 },
  { label: "旧钢琴", count: 2 },
  { label: "沙发海", count: 5 },
  { label: "日记本", count: 3 },
  { label: "流浪云", count: 6 },
  { label: "月亮", count: 7 },
  { label: "橘子汽水", count: 4 },
  { label: "独行旅人", count: 8 },
  { label: "梦游者", count: 3 },
  { label: "冷感浪漫", count: 5 },
  { label: "理性怪物", count: 9 },
  { label: "温柔废墟", count: 4 },
  { label: "深海信号", count: 2 },
  { label: "宇宙邮差", count: 6 },
  { label: "晚风", count: 3 },
  { label: "黑胶唱片", count: 5 },
  { label: "星光体", count: 4 },
  { label: "沉默诗", count: 3 },
  { label: "边界之外", count: 7 },
];

const FONT_MIN = 13;
const FONT_MAX = 28;
const COUNT_MIN = Math.min(...MOCK_WORDS.map((w) => w.count));
const COUNT_MAX = Math.max(...MOCK_WORDS.map((w) => w.count));

function fontSize(count: number): number {
  if (COUNT_MAX === COUNT_MIN) return FONT_MIN;
  return FONT_MIN + ((count - COUNT_MIN) / (COUNT_MAX - COUNT_MIN)) * (FONT_MAX - FONT_MIN);
}

/* ================================================================== */
/*  Fibonacci sphere — evenly distributed points on unit sphere         */
/* ================================================================== */

interface WordPoint {
  label: string;
  count: number;
  fontSize: number;
  x: number;
  y: number;
  z: number;
}

function buildWords(
  words: { label: string; count: number }[],
): WordPoint[] {
  const n = words.length;
  const phi = Math.PI * (3 - Math.sqrt(5));
  return words.map((w, i) => {
    const y = 1 - (2 * i + 1) / n; // -1 .. +1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    return {
      label: w.label,
      count: w.count,
      fontSize: fontSize(w.count),
      x: Math.cos(theta) * radiusAtY,
      y,
      z: Math.sin(theta) * radiusAtY,
    };
  });
}

/* ================================================================== */
/*  3D projection helpers                                               */
/* ================================================================== */

function rotateX(x: number, y: number, z: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x, y: y * cos - z * sin, z: y * sin + z * cos };
}

function rotateY(x: number, y: number, z: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - z * sin, y, z: x * sin + z * cos };
}

/* ================================================================== */
/*  Modal                                                                */
/* ================================================================== */

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WordSphereModal({ open, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const rxRef = useRef(0.3); // rotation X (radians)
  const ryRef = useRef(0); // rotation Y
  const velXRef = useRef(0);
  const velYRef = useRef(0);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const wordsRef = useRef<WordPoint[]>([]);

  if (wordsRef.current.length === 0) {
    wordsRef.current = buildWords(MOCK_WORDS);
  }

  /* ---- Auto-rotate + inertia ---- */
  const animate = useCallback(() => {
    if (!containerRef.current) return;
    const sphere = containerRef.current as HTMLDivElement;
    const words = wordsRef.current;

    if (!draggingRef.current) {
      // auto-rotate
      ryRef.current += 0.004;
      // inertia decay
      velXRef.current *= 0.95;
      velYRef.current *= 0.95;
      rxRef.current += velXRef.current;
      ryRef.current += velYRef.current;
    }

    const rx = rxRef.current;
    const ry = ryRef.current;
    const R = sphere.getBoundingClientRect().width * 0.38;

    // Project all words
    const projected = words.map((w) => {
      let p = rotateY(w.x, w.y, w.z, ry);
      p = rotateX(p.x, p.y, p.z, rx);
      return { label: w.label, fontSize: w.fontSize, x: p.x, y: p.y, z: p.z };
    });

    // Sort by z (back to front)
    projected.sort((a, b) => a.z - b.z);

    // Update DOM
    const els = sphere.children;
    for (let i = 0; i < projected.length; i++) {
      const el = els[i] as HTMLElement | undefined;
      if (!el) continue;
      const p = projected[i];
      const zNorm = (p.z + 1) / 2; // 0 (back) .. 1 (front)
      const scale = 0.55 + zNorm * 0.45;
      const opacity = 0.3 + zNorm * 0.7;
      el.style.transform = `translate(-50%, -50%) translate(${p.x * R}px, ${p.y * R}px) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.fontSize = `${p.fontSize}px`;
      el.style.zIndex = String(i);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  /* ---- Start / stop animation ---- */
  useEffect(() => {
    if (open) {
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [open, animate]);

  /* ---- Drag handlers ---- */
  function onPointerDown(e: React.PointerEvent) {
    draggingRef.current = true;
    lastRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastRef.current.x;
    const dy = e.clientY - lastRef.current.y;
    velYRef.current = dx * 0.005;
    velXRef.current = dy * 0.005;
    rxRef.current += dy * 0.005;
    ryRef.current += dx * 0.005;
    lastRef.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp() {
    draggingRef.current = false;
  }

  /* ---- Close on overlay click ---- */
  function onOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onOverlayClick}
    >
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: "min(80vw, 360px)",
          height: "min(80vw, 360px)",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {wordsRef.current.map((w, i) => (
          <span
            key={`${w.label}-${i}`}
            className="absolute left-1/2 top-1/2 select-none whitespace-nowrap"
            style={{
              color: "white",
              textShadow:
                "0 0 6px rgba(255,255,255,0.85), 0 0 14px rgba(255,255,255,0.65), 0 0 28px rgba(180,220,255,0.45)",
              fontSize: w.fontSize,
              fontWeight: 500,
              willChange: "transform, opacity",
              // initial: center, small, hidden
              transform: "translate(-50%, -50%) translate(0px, 0px) scale(0.55)",
              opacity: 0.3,
            }}
          >
            {w.label}
          </span>
        ))}
      </div>
    </div>
  );
}
