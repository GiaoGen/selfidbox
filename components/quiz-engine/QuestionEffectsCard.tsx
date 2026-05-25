"use client";

import type { Question, Factor } from "@/lib/mock-quiz-engine";
import type { OptionEffect } from "@/lib/mock-quiz-engine";
import { InlineEditableInput } from "@/components/quiz-studio/InlineEditableInput";

const EFFECT_COLORS: Record<string, string> = {
  sensitivity: "bg-[#ffb084]/20 text-[#8b5e3c]",
  expressiveness: "bg-[#ff4d8b]/15 text-[#b8315a]",
  imagination: "bg-[#b8a4ed]/25 text-[#5a3e9e]",
  drive: "bg-[#e8b94a]/20 text-[#8b6f1a]",
  orderliness: "bg-[#1a3a3a]/15 text-[#1a3a3a]",
};

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
};

export function QuestionEffectsCard({
  question,
  factors,
  index,
  onChange,
  onDelete,
}: Props) {
  const isEditing = !!onChange;
  const update = onChange ?? (() => {});

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
    <div className="rounded-[24px] bg-[var(--surface-card)] p-5 sm:p-6 group/qcard relative">
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ink)]/8 text-sm leading-none opacity-0 transition-opacity group-hover/qcard:opacity-100 hover:bg-[var(--ink)]/16"
        >
          ×
        </button>
      )}

      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
          {index + 1}
        </span>
        <p className="text-sm font-semibold text-[var(--muted)]">Question {index + 1}</p>
      </div>

      {isEditing ? (
        <InlineEditableInput
          value={question.text}
          onChange={(v) => update({ ...question, text: v })}
          placeholder="题目文字"
          className="mt-3 text-lg font-semibold leading-7 text-[var(--ink)] w-full"
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
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-semibold text-white">
                {option.label}
              </span>
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <InlineEditableInput
                      value={option.text}
                      onChange={(v) => updateOption(oIndex, { text: v })}
                      placeholder="选项文字"
                      className="text-sm font-semibold text-[var(--ink)] w-full"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {factors.map((f) => {
                        const delta = option.effects[f.id] ?? 0;
                        const colorClass =
                          EFFECT_COLORS[f.id] ?? "bg-[var(--surface-strong)]";
                        return (
                          <span
                            key={f.id}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
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
                        const colorClass =
                          EFFECT_COLORS[factorId] ?? "bg-[var(--surface-strong)]";
                        return (
                          <span
                            key={factorId}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
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
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink)]/8 text-[0.6rem] leading-none opacity-0 transition-opacity group-hover/opt:opacity-100 hover:bg-[var(--ink)]/16"
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
