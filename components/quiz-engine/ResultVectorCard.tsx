"use client";

import { Pin, PinOff } from "lucide-react";
import type { Result, Factor, ResultVector } from "@/lib/mock-quiz-engine";
import { EditableSlider } from "@/components/quiz-studio/EditableSlider";

const CARD_ACCENTS = [
  "border-l-[#ffb084]",
  "border-l-[#ff4d8b]",
  "border-l-[#b8a4ed]",
  "border-l-[#e8b94a]",
  "border-l-[#1a3a3a]",
];

function getReadableTextColor(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
}

type Props = {
  result: Result;
  vector: ResultVector;
  factors: Factor[];
  index: number;
  onValueChange?: (factorId: string, value: number) => void;
  onTogglePin?: () => void;
  accentColor?: string;
};

export function ResultVectorCard({
  result,
  vector,
  factors,
  index,
  onValueChange,
  onTogglePin,
  accentColor,
}: Props) {
  const isEditing = !!onValueChange;
  const pinned = vector.isPinned;
  const hasColor = !!accentColor;

  // Full-card background when accentColor is set
  const cardStyle = hasColor
    ? ({ backgroundColor: accentColor } as React.CSSProperties)
    : undefined;

  // Readable text color against card background
  const textColor = hasColor
    ? getReadableTextColor(accentColor!)
    : "var(--ink)";
  const isDarkText = hasColor && getReadableTextColor(accentColor!) === "#1a1a1a";

  const mutedColor = hasColor
    ? isDarkText ? "rgba(10,10,10,0.55)" : "rgba(255,255,255,0.6)"
    : "var(--muted)";
  const bodyColor = hasColor
    ? isDarkText ? "rgba(10,10,10,0.7)" : "rgba(255,255,255,0.8)"
    : "var(--body)";
  const sliderTrackBg = hasColor
    ? isDarkText ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.2)"
    : "var(--surface-strong)";

  // Buttons
  const btnBase = "flex h-7 w-7 items-center justify-center rounded-full transition-colors";
  const btnVisible = hasColor
    ? isDarkText
      ? "bg-black/10 text-[var(--ink)]/60 hover:bg-black/20 hover:text-[var(--ink)]"
      : "bg-white/20 text-white/70 hover:bg-white/35 hover:text-white"
    : "bg-black/8 text-[var(--ink)]/60 hover:bg-black/16 hover:text-[var(--ink)]";
  const pinActive = hasColor
    ? isDarkText
      ? "bg-black/15 text-[var(--ink)]"
      : "bg-white/30 text-white"
    : "bg-[var(--ink)]/12 text-[var(--ink)]";

  const badgeBg = hasColor
    ? isDarkText ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.15)"
    : "var(--surface-strong)";

  return (
    <article
      className={`rounded-[24px] p-5 transition-shadow relative ${
        hasColor ? "" : `bg-[var(--surface-card)] border-l-[4px] ${CARD_ACCENTS[index % CARD_ACCENTS.length]}`
      } ${
        pinned ? "ring-2 ring-[var(--ink)]/10 shadow-[0_0_16px_rgba(10,10,10,0.05)]" : ""
      }`}
      style={hasColor ? { ...cardStyle, borderLeftColor: accentColor } : undefined}
    >
      <div className="flex items-center justify-between">
        <h3
          className="text-xl font-semibold tracking-[-0.02em]"
          style={{ color: textColor }}
        >
          {result.name}
        </h3>
        <div className="flex items-center gap-1.5">
          {onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              className={`${btnBase} ${
                pinned ? pinActive : btnVisible
              }`}
              title={pinned ? "取消固定" : "固定此向量"}
            >
              {pinned ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
            </button>
          )}
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: badgeBg, color: mutedColor }}
          >
            Result Vector
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm" style={{ color: mutedColor }}>{result.description}</p>

      <div className="mt-5 space-y-4">
        {factors.map((factor) => {
          const value = vector.values[factor.id] ?? 0;
          return (
            <div key={factor.id}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-semibold" style={{ color: bodyColor }}>
                  {factor.name}
                </span>
              </div>
              {isEditing ? (
                <EditableSlider
                  value={value}
                  onChange={(v) => onValueChange(factor.id, v)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 h-3 rounded-full overflow-hidden"
                    style={{ backgroundColor: sliderTrackBg }}
                  >
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{ width: `${value}%`, backgroundColor: "var(--ink)" }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold tabular-nums" style={{ color: textColor }}>
                    {value}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}
