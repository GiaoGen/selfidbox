"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { WordCloudWord } from "@/components/profile/useWordCloud";

/* ================================================================== */
/*  Pad words to fill the sphere — repeat real words as needed          */
/* ================================================================== */

const PAD_TARGET = 28;
const FONT_MIN = 11;
const FONT_MAX = 28;
const REPEAT_FONT_MIN = 13;
const REPEAT_FONT_MAX = 18;

interface PaddedWord {
  label: string;
  count: number;
  repeated: boolean;
}

function padWords(words: WordCloudWord[]): PaddedWord[] {
  if (words.length === 0) return [];

  const padded: PaddedWord[] = words.map((w) => ({
    label: w.label,
    count: w.count,
    repeated: false,
  }));

  if (padded.length >= PAD_TARGET) return padded;

  let i = 0;
  while (padded.length < PAD_TARGET) {
    padded.push({
      label: words[i % words.length].label,
      count: Math.max(1, Math.round(words[i % words.length].count * 0.4)),
      repeated: true,
    });
    i++;
  }
  return padded;
}

/* ================================================================== */
/*  Font-size mapping (linear, count → px)                              */
/* ================================================================== */

function computeFontSize(words: WordCloudWord[], count: number, repeated: boolean): number {
  if (repeated) {
    const min = Math.min(...words.map((w) => w.count));
    const max = Math.max(...words.map((w) => w.count));
    if (max === min) return (REPEAT_FONT_MIN + REPEAT_FONT_MAX) / 2;
    const ratio = (count - min) / (max - min);
    return REPEAT_FONT_MIN + ratio * (REPEAT_FONT_MAX - REPEAT_FONT_MIN);
  }

  if (words.length === 0) return FONT_MIN;
  const counts = words.map((w) => w.count);
  const cMin = Math.min(...counts);
  const cMax = Math.max(...counts);
  if (cMax === cMin) return (FONT_MIN + FONT_MAX) / 2;
  return FONT_MIN + ((count - cMin) / (cMax - cMin)) * (FONT_MAX - FONT_MIN);
}

/* ================================================================== */
/*  Fibonacci sphere — evenly distributed points on unit sphere         */
/* ================================================================== */

interface WordPoint {
  label: string;
  fontSize: number;
  repeated: boolean;
  x: number;
  y: number;
  z: number;
  twinklePhase: number;
}

function buildWords(words: WordCloudWord[], padded: PaddedWord[]): WordPoint[] {
  const n = padded.length;
  const phi = Math.PI * (3 - Math.sqrt(5));
  return padded.map((w, i) => {
    const y = 1 - (2 * i + 1) / n;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    return {
      label: w.label,
      fontSize: computeFontSize(words, w.count, w.repeated),
      repeated: w.repeated,
      x: Math.cos(theta) * radiusAtY,
      y,
      z: Math.sin(theta) * radiusAtY,
      twinklePhase: Math.random() * Math.PI * 2,
    };
  });
}

/* ================================================================== */
/*  Background stardust particles — scattered around the sphere          */
/*  Desktop: 16 particles, single-layer glow. Mobile: disabled (0).      */
/* ================================================================== */

const BG_DESKTOP_COUNT = 16;
const BG_FONT_MIN = 8;
const BG_FONT_MAX = 16;

interface BgParticle {
  fontSize: number;
  xPct: number;   // 0–100, percentage of viewport width
  yPct: number;   // 0–100, percentage of viewport height
  baseOpacity: number;
  twinklePhase: number;
  labelOffset: number; // random offset for word cycling (0–100)
}

/**
 * Generate background particles placed outside the central sphere area.
 * The exclusion zone is a circle centered at (50%, 50%) with a generous radius.
 */
function generateBgParticles(words: WordCloudWord[], count: number): BgParticle[] {
  if (words.length === 0 || count <= 0) return [];

  const EXCLUSION_RADIUS_PCT = 26;

  function isInsideExclusion(x: number, y: number): boolean {
    const dx = x - 50;
    const dy = y - 50;
    return Math.sqrt(dx * dx + dy * dy) < EXCLUSION_RADIUS_PCT;
  }

  const regions: { xRange: [number, number]; yRange: [number, number] }[] = [
    { xRange: [4, 22],  yRange: [4, 20]  },
    { xRange: [78, 96], yRange: [4, 20]  },
    { xRange: [4, 22],  yRange: [80, 96] },
    { xRange: [78, 96], yRange: [80, 96] },
    { xRange: [22, 78], yRange: [3, 14]  },
    { xRange: [22, 78], yRange: [86, 97] },
    { xRange: [3, 14],  yRange: [20, 80] },
    { xRange: [86, 97], yRange: [20, 80] },
  ];

  const particles: BgParticle[] = [];

  for (let i = 0; i < count; i++) {
    const region = regions[i % regions.length];
    const xPct =
      region.xRange[0] + Math.random() * (region.xRange[1] - region.xRange[0]);
    const yPct =
      region.yRange[0] + Math.random() * (region.yRange[1] - region.yRange[0]);

    if (isInsideExclusion(xPct, yPct)) continue;

    particles.push({
      fontSize: BG_FONT_MIN + Math.random() * (BG_FONT_MAX - BG_FONT_MIN),
      xPct,
      yPct,
      baseOpacity: 0.18 + Math.random() * 0.28,
      twinklePhase: Math.random() * Math.PI * 2,
      labelOffset: Math.random() * 100,
    });
  }

  return particles;
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
  words: WordCloudWord[];
}

export function WordSphereModal({ open, onClose, words }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const rxRef = useRef(0.3);
  const ryRef = useRef(0);
  const velXRef = useRef(0);
  const velYRef = useRef(0);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const wordsRef = useRef<WordPoint[]>([]);
  const bgParticlesRef = useRef<BgParticle[]>([]);
  const wordPoolRef = useRef<WordCloudWord[]>([]); // for bg particle label cycling

  /* ---- Mobile detection: disable bg particles on small screens ---- */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  /* ---- Entrance animation: bg shows instantly, content fades in ---- */
  const [entering, setEntering] = useState(true);
  useEffect(() => {
    if (open) {
      setEntering(true);
      const timer = setTimeout(() => setEntering(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Rebuild sphere points and bg particles when words change
  const prevWordsKey = useRef("");
  const wordsKey = words.map((w) => `${w.label}:${w.count}`).join(",");
  if (wordsKey !== prevWordsKey.current || wordsRef.current.length === 0) {
    prevWordsKey.current = wordsKey;
    wordPoolRef.current = words;
    const padded = padWords(words);
    wordsRef.current = buildWords(words, padded);
    bgParticlesRef.current = generateBgParticles(words, isMobile ? 0 : BG_DESKTOP_COUNT);
  }

  /* ---- Auto-rotate + inertia + twinkle (sphere + background) ---- */
  const animate = useCallback(() => {
    if (!containerRef.current) return;
    const sphere = containerRef.current as HTMLDivElement;
    const wps = wordsRef.current;

    if (!draggingRef.current) {
      ryRef.current += 0.004;
      velXRef.current *= 0.95;
      velYRef.current *= 0.95;
      rxRef.current += velXRef.current;
      ryRef.current += velYRef.current;
    }

    const rx = rxRef.current;
    const ry = ryRef.current;
    const R = sphere.getBoundingClientRect().width * 0.38;
    const t = Date.now() * 0.001;

    // ── Update 3D sphere words ──
    const projected = wps.map((w) => {
      let p = rotateY(w.x, w.y, w.z, ry);
      p = rotateX(p.x, p.y, p.z, rx);
      return {
        label: w.label,
        fontSize: w.fontSize,
        repeated: w.repeated,
        twinklePhase: w.twinklePhase,
        x: p.x,
        y: p.y,
        z: p.z,
      };
    });

    projected.sort((a, b) => a.z - b.z);

    const els = sphere.children;
    for (let i = 0; i < projected.length; i++) {
      const el = els[i] as HTMLElement | undefined;
      if (!el) continue;
      const p = projected[i];
      const zNorm = (p.z + 1) / 2;
      const scale = 0.55 + zNorm * 0.45;

      const baseOpacity = p.repeated
        ? 0.2 + zNorm * 0.35
        : 0.3 + zNorm * 0.7;

      const twinkle = 0.85 + 0.15 * Math.sin(t * 1.8 + p.twinklePhase);
      const opacity = baseOpacity * twinkle;

      const glowIntensity = 0.7 + 0.3 * Math.sin(t * 2.3 + p.twinklePhase + 0.5);
      const glowAlpha1 = 0.6 + 0.25 * glowIntensity;
      const glowAlpha2 = 0.45 + 0.2 * glowIntensity;
      const glowAlpha3 = 0.3 + 0.15 * glowIntensity;

      el.style.transform = `translate(-50%, -50%) translate(${p.x * R}px, ${p.y * R}px) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.fontSize = `${p.fontSize}px`;
      el.style.zIndex = String(i);
      el.style.textShadow =
        `0 0 ${Math.round(6 * glowIntensity)}px rgba(255,255,255,${glowAlpha1.toFixed(2)}), ` +
        `0 0 ${Math.round(14 * glowIntensity)}px rgba(255,255,255,${glowAlpha2.toFixed(2)}), ` +
        `0 0 ${Math.round(28 * glowIntensity)}px rgba(180,220,255,${glowAlpha3.toFixed(2)})`;
    }

    // ── Update background stardust particles (lightweight, desktop only) ──
    if (bgRef.current) {
      const bgEls = bgRef.current.children;
      const bps = bgParticlesRef.current;
      const pool = wordPoolRef.current;
      for (let i = 0; i < bps.length; i++) {
        const el = bgEls[i] as HTMLElement | undefined;
        if (!el) continue;
        const bp = bps[i];

        // Cycle word label
        if (pool.length > 0) {
          const wordIdx = Math.floor((t * 0.35 + bp.labelOffset) % pool.length);
          el.textContent = pool[wordIdx].label;
        }

        // Subtle opacity twinkle only — no per-frame glow recalculation
        const twinkle = 0.85 + 0.15 * Math.sin(t * 1.8 + bp.twinklePhase);
        el.style.opacity = String(bp.baseOpacity * twinkle);
      }
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

  if (words.length === 0) {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center"
        style={{ background: isMobile ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.85)" }}
        onClick={onOverlayClick}
      >
        <p className="max-w-xs text-center text-white/70 text-base leading-relaxed px-6">
          完成几个 Quiz 后，这里会长出你的人格星球。
        </p>
      </div>
    );
  }

  const hasBgParticles = bgParticlesRef.current.length > 0;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center"
      style={{ background: isMobile ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.85)" }}
      onClick={onOverlayClick}
    >
      {/* ── Background stardust layer (desktop only, skipped on mobile) ── */}
      {hasBgParticles && (
      <div
        ref={bgRef}
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {bgParticlesRef.current.map((p, i) => (
          <span
            key={`bg-${i}`}
            className="absolute select-none whitespace-nowrap"
            style={{
              color: "white",
              fontWeight: 500,
              fontSize: p.fontSize,
              left: `${p.xPct}%`,
              top: `${p.yPct}%`,
              transform: "translate(-50%, -50%)",
              opacity: entering ? 0 : p.baseOpacity,
              textShadow: "0 0 8px rgba(255,255,255,0.45)",
              transition: `opacity 500ms ease-out ${Math.round(p.labelOffset * 5)}ms`,
            }}
          >
            {wordPoolRef.current[i % wordPoolRef.current.length]?.label ?? ""}
          </span>
        ))}
      </div>
      )}

      {/* ── 3D Sphere ── */}
      <div
        ref={containerRef}
        className="relative"
        style={{
          width: "min(80vw, 360px)",
          height: "min(80vw, 360px)",
          touchAction: "none",
          zIndex: 1,
          opacity: entering ? 0 : 1,
          transform: entering ? "scale(0.92)" : "scale(1)",
          transition: "opacity 500ms ease-out 200ms, transform 600ms ease-out 200ms",
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
              fontWeight: 500,
              fontSize: w.fontSize,
              willChange: "transform, opacity",
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
