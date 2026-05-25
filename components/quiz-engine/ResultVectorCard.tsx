"use client";

import { Pin, PinOff } from "lucide-react";
import type { Result, Factor, ResultVector } from "@/lib/mock-quiz-engine";
import { EditableSlider } from "@/components/quiz-studio/EditableSlider";

const BAR_COLORS = [
  "bg-[#ffb084]",
  "bg-[#ff4d8b]",
  "bg-[#b8a4ed]",
  "bg-[#e8b94a]",
  "bg-[#1a3a3a]",
];

const CARD_ACCENTS = [
  "border-l-[#ffb084]",
  "border-l-[#ff4d8b]",
  "border-l-[#b8a4ed]",
  "border-l-[#e8b94a]",
  "border-l-[#1a3a3a]",
];

const btnBase = "flex h-7 w-7 items-center justify-center rounded-full transition-all";
const btnVisible = "bg-black/8 text-[var(--ink)]/60 hover:bg-black/16 hover:text-[var(--ink)]";

type Props = {
  result: Result;
  vector: ResultVector;
  factors: Factor[];
  index: number;
  onValueChange?: (factorId: string, value: number) => void;
  onTogglePin?: () => void;
};

export function ResultVectorCard({
  result,
  vector,
  factors,
  index,
  onValueChange,
  onTogglePin,
}: Props) {
  const barColor = BAR_COLORS[index % BAR_COLORS.length];
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  const isEditing = !!onValueChange;
  const pinned = vector.isPinned;

  return (
    <article
      className={`rounded-[24px] bg-[var(--surface-card)] p-5 border-l-[4px] ${accent} transition-shadow relative ${
        pinned ? "ring-2 ring-[var(--ink)]/10 shadow-[0_0_16px_rgba(10,10,10,0.05)]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold tracking-[-0.02em]">{result.name}</h3>
        <div className="flex items-center gap-1.5">
          {onTogglePin && (
            <button
              type="button"
              onClick={onTogglePin}
              className={`${btnBase} ${
                pinned
                  ? "bg-[var(--ink)]/12 text-[var(--ink)]"
                  : btnVisible
              }`}
              title={pinned ? "取消固定" : "固定此向量"}
            >
              {pinned ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
            </button>
          )}
          <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
            Result Vector
          </span>
        </div>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">{result.description}</p>

      <div className="mt-5 space-y-4">
        {factors.map((factor) => {
          const value = vector.values[factor.id] ?? 0;
          return (
            <div key={factor.id}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-semibold text-[var(--body)]">
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
                  <div className="flex-1 h-3 rounded-full bg-[var(--surface-strong)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-[var(--ink)] tabular-nums">
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
