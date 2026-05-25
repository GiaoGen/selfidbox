"use client";

import { useRef, useCallback } from "react";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
};

export function EditableSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  className = "",
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
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    update(e.clientX);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (e.buttons > 0) {
      update(e.clientX);
    }
  }

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-current/10 touch-none select-none"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-current/40 transition-all"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-current shadow-sm ring-1 ring-white/40 transition-all hover:scale-110 active:scale-95"
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums opacity-70">
        {value}
      </span>
    </div>
  );
}
