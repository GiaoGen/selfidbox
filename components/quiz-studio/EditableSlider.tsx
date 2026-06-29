"use client";

import { useRef, useCallback } from "react";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  inverted?: boolean;
};

export function EditableSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  className = "",
  inverted,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  const update = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const v = Math.round(ratio * (max - min) + min);
      onChange(v);
    },
    [onChange, min, max],
  );

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    trackRef.current!.setPointerCapture(e.pointerId);
    update(e.clientX);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (e.buttons > 0) {
      e.preventDefault();
      update(e.clientX);
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    trackRef.current!.releasePointerCapture(e.pointerId);
  }

  const pct = ((value - min) / (max - min)) * 100;

  // Track: always black. On inverted bg, use slightly lighter for contrast
  const trackBg = inverted ? "rgba(255,255,255,0.15)" : "var(--ink)";
  const trackBgOpacity = inverted ? 1 : 0.1;
  const fillColor = inverted ? "rgba(255,255,255,0.5)" : "var(--ink)";
  const fillOpacity = inverted ? 1 : 0.4;
  const thumbColor = inverted ? "#ffffff" : "var(--ink)";
  const valueColor = inverted ? "rgba(255,255,255,0.65)" : "var(--muted)";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative h-1.5 flex-1 cursor-pointer rounded-full touch-none select-none"
        style={{ backgroundColor: trackBg, opacity: trackBgOpacity }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width]"
          style={{ width: `${pct}%`, backgroundColor: fillColor, opacity: fillOpacity }}
        />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full shadow-sm ring-1 ring-white/40 transition-transform hover:scale-110 active:scale-95"
          style={{ left: `${pct}%`, backgroundColor: thumbColor }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  );
}
