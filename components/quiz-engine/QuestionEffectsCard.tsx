"use client";

import { Pin, PinOff } from "lucide-react";
import type { Question, Factor } from "@/lib/mock-quiz-engine";
import type { OptionEffect } from "@/lib/mock-quiz-engine";
import { InlineEditableInput } from "@/components/quiz-studio/InlineEditableInput";

function getEffectStyle(hex: string): React.CSSProperties {
  return {
    backgroundColor: `${hex}20`,
    color: hex,
  };
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function getFactorName(factorId: string, factors: Factor[]): string {
  return factors.find((f) => f.id === factorId)?.name ?? factorId;
}

function formatDelta(delta: number): string {
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

type Props = {
  question: Question;
  factors: Factor[];
  index: number;
  onChange?: (question: Question) => void;
  onDelete?: () => void;
  onTogglePin?: () => void;
  accentColors?: string[];
};

const btnBase = "flex h-7 w-7 items-center justify-center rounded-full transition-all";
const btnVisible = "bg-black/8 text-[var(--ink)]/60 hover:bg-black/16 hover:text-[var(--ink)]";

export function QuestionEffectsCard({
  question,
  factors,
  index,
  onChange,
  onDelete,
  onTogglePin,
  accentColors,
}: Props) {
  const isEditing = !!onChange;
  const update = onChange ?? (() => {});
  const pinned = question.isPinned;

  function updateOption(
    oIndex: number,
    patch: Partial<OptionEffect>,
  ) {
    const next = question.options.map((o, i) =>
      i === oIndex ? { ...o, ...patch } : o,
    );
    update({ ...question, options: next });
  }

  function addOption() {
    const label = String.fromCharCode(65 + question.options.length);
    update({
      ...question,
      options: [
        ...question.options,
        {
          label,
          text: "",
          effects: Object.fromEntries(factors.map((f) => [f.id, 0])),
        },
      ],
    });
  }

  function deleteOption(oIndex: number) {
    update({
      ...question,
      options: question.options.filter((_, i) => i !== oIndex),
    });
  }

  function updateEffect(oIndex: number, factorId: string, delta: number) {
    const opt = question.options[oIndex];
    updateOption(oIndex, {
      effects: { ...opt.effects, [factorId]: Math.max(-3, Math.min(3, delta)) },
    });
  }

  return (
    <div
      className={`rounded-[24px] bg-[var(--surface-card)] p-5 sm:p-6 group/qcard relative transition-shadow ${
        pinned ? "ring-2 ring-[var(--ink)]/10 shadow-[0_0_16px_rgba(10,10,10,0.05)]" : ""
      }`}
    >
      <div className="absolute right-4 top-4 flex items-center gap-0.5">
        {onTogglePin && (
          <button
            type="button"
            onClick={onTogglePin}
            className={`${btnBase} ${
              pinned
                ? "bg-[var(--ink)]/12 text-[var(--ink)]"
                : btnVisible
            }`}
            title={pinned ? "取消固定" : "固定此题"}
          >
            {pinned ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className={`${btnBase} ${btnVisible}`}
            title="删除"
          >
            ×
          </button>
        )}
      </div>

      <p className="text-sm font-semibold text-[var(--muted)]">Question {index + 1}</p>

      {isEditing ? (
        <InlineEditableInput
          block
          value={question.text}
          onChange={(v) => update({ ...question, text: v })}
          placeholder="题目文字"
          className="mt-3 text-lg font-semibold leading-7 text-[var(--ink)]"
        />
      ) : (
        <p className="mt-3 text-lg font-semibold leading-7 text-[var(--ink)]">
          {question.text}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {question.options.map((option, oIndex) => (
          <div
            key={oIndex}
            className="rounded-[16px] bg-[var(--surface-soft)] p-4 group/opt relative"
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-xl font-bold text-[var(--ink)] leading-none">
                {option.label}
              </span>
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <InlineEditableInput
                      block
                      value={option.text}
                      onChange={(v) => updateOption(oIndex, { text: v })}
                      placeholder="选项文字"
                      className="text-sm font-semibold text-[var(--ink)]"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {factors.map((f) => {
                        const delta = option.effects[f.id] ?? 0;
                        const efIdx = factors.findIndex((x) => x.id === f.id);
                        const efColor = accentColors?.[efIdx % (accentColors?.length || 1)] ?? "#888888";
                        const efStyle = getEffectStyle(efColor);
                        const efDark = isLight(efColor);
                        return (
                          <span
                            key={f.id}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: `${efColor}20`, color: efDark ? "var(--ink)" : efColor }}
                          >
                            {f.name}
                            <input
                              type="number"
                              min={-3}
                              max={3}
                              value={delta}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v)) updateEffect(oIndex, f.id, v);
                              }}
                              className="w-8 bg-transparent text-center text-xs font-semibold tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[var(--ink)]">{option.text}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Object.entries(option.effects).map(([factorId, delta]) => {
                        if (delta === 0) return null;
                        const efIdx = factors.findIndex((f) => f.id === factorId);
                        const efColor = accentColors?.[efIdx % (accentColors?.length || 1)] ?? "#888888";
                        return (
                          <span
                            key={factorId}
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: `${efColor}20`, color: efColor }}
                          >
                            {getFactorName(factorId, factors)} {formatDelta(delta)}
                          </span>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
            {isEditing && question.options.length > 1 && (
              <button
                type="button"
                onClick={() => deleteOption(oIndex)}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/8 text-[var(--ink)]/60 hover:bg-black/16 hover:text-[var(--ink)] transition-all"
                title="删除选项"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <button
          type="button"
          onClick={addOption}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--ink)]/6 px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-all hover:bg-[var(--ink)]/12"
        >
          + 添加选项
        </button>
      )}
    </div>
  );
}
