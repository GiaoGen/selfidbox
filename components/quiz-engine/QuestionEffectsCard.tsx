"use client";

import { useRef, useEffect } from "react";
import { Pin, PinOff, SlidersHorizontal } from "lucide-react";
import type { Question, Factor } from "@/lib/mock-quiz-engine";
import type { OptionEffect } from "@/lib/mock-quiz-engine";

type Props = {
  question: Question;
  factors: Factor[];
  index: number;
  onChange?: (question: Question) => void;
  onDelete?: () => void;
  onTogglePin?: () => void;
  onOptionVectorClick?: (optionIndex: number) => void;
  accentColors?: string[];
};

const btnBase = "flex h-7 w-7 items-center justify-center rounded-full transition-colors";
const btnVisible = "bg-black/8 text-[var(--ink)]/60 hover:bg-black/16 hover:text-[var(--ink)]";

export function QuestionEffectsCard({
  question,
  factors,
  index,
  onChange,
  onDelete,
  onTogglePin,
  onOptionVectorClick,
  accentColors,
}: Props) {
  const isEditing = !!onChange;
  const update = onChange ?? (() => {});
  const pinned = question.isPinned;

  const qTextareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = qTextareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [question.text]);

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
        <textarea
          ref={qTextareaRef}
          value={question.text}
          onChange={(e) => update({ ...question, text: e.target.value })}
          rows={1}
          placeholder="题目文字"
          className="mt-3 w-full resize-none overflow-hidden bg-transparent border-b border-current/10 hover:border-current/25 focus:border-current/30 focus:outline-none rounded-sm px-1 py-0.5 text-lg font-semibold leading-7 text-[var(--ink)] placeholder:text-current/20"
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
                  <textarea
                    value={option.text}
                    onChange={(e) => updateOption(oIndex, { text: e.target.value })}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }}
                    rows={1}
                    placeholder="选项文字"
                    className="w-full resize-none overflow-hidden bg-transparent border-b border-current/10 hover:border-current/25 focus:border-current/30 focus:outline-none rounded-sm px-1 py-0.5 text-sm font-semibold text-[var(--ink)] placeholder:text-current/20"
                  />
                ) : (
                  <p className="text-sm font-semibold text-[var(--ink)]">{option.text}</p>
                )}
              </div>
            </div>
            {isEditing && question.options.length > 1 && (
              <button
                type="button"
                onClick={() => deleteOption(oIndex)}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/8 text-[var(--ink)]/60 hover:bg-black/16 hover:text-[var(--ink)] transition-colors"
                title="删除选项"
              >
                ×
              </button>
            )}
            {/* Vector edit button — bottom-right */}
            {isEditing && onOptionVectorClick && (
              <button
                type="button"
                onClick={() => onOptionVectorClick(oIndex)}
                className="absolute right-2 bottom-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ink)]/6 text-[var(--ink)]/45 hover:text-[var(--ink)] hover:bg-[var(--ink)]/12 transition-colors"
                title="编辑选项向量"
              >
                <SlidersHorizontal size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <button
          type="button"
          onClick={addOption}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--ink)]/6 px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--ink)]/12"
        >
          + 添加选项
        </button>
      )}
    </div>
  );
}
