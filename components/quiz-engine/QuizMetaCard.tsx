"use client";

import type { QuizMeta } from "@/lib/mock-quiz-engine";
import { InlineEditableInput } from "@/components/quiz-studio/InlineEditableInput";
import { InlineEditableTextarea } from "@/components/quiz-studio/InlineEditableTextarea";

/* ------------------------------------------------------------------ */
/*  Mini StepLabel (inline, no extra import needed)                     */
/* ------------------------------------------------------------------ */

function StepLabel({ num, label, light }: { num: number; label: string; light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
        {num}
      </span>
      <h2 className={`text-xl font-semibold tracking-[-0.02em] ${light ? "text-white" : "text-[var(--ink)]"}`}>
        {label}
      </h2>
    </div>
  );
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

type Props = {
  meta: QuizMeta;
  onChange?: (patch: Partial<QuizMeta>) => void;
  bgColor?: string;
  /** When provided, renders step header at the top */
  stepNumber?: number;
  stepLabel?: string;
};

export function QuizMetaCard({ meta, onChange, bgColor, stepNumber, stepLabel }: Props) {
  const isEditing = !!onChange;
  const update = onChange ?? (() => {});

  const hasBg = !!bgColor;
  const light = hasBg && !isLight(bgColor!);
  const textClass = light ? "text-white" : "text-[var(--ink)]";
  const mutedClass = light ? "text-white/60" : "text-[var(--muted)]";

  const sectionStyle = bgColor
    ? { backgroundColor: bgColor } as React.CSSProperties
    : { background: "linear-gradient(135deg,#b8a4ed_0%,#ffb084_62%,#fffaf0_100%)" } as React.CSSProperties;

  return (
    <section
      className="overflow-hidden rounded-[32px] p-6 shadow-[0_18px_50px_rgba(10,10,10,0.08)] sm:p-8"
      style={sectionStyle}
    >
      {/* When stepLabel is provided, render step header */}
      {stepLabel && stepNumber != null ? (
        <StepLabel num={stepNumber} label={stepLabel} light={light} />
      ) : (
        <p className={`text-sm font-semibold ${mutedClass} ${light ? "" : "opacity-70"}`}>Quiz Meta</p>
      )}

      {isEditing ? (
        <InlineEditableInput
          block
          value={meta.title}
          onChange={(v) => update({ title: v })}
          placeholder="输入测试标题"
          className={`mt-2 text-4xl font-semibold tracking-[-0.03em] ${textClass}`}
        />
      ) : (
        <h2 className={`mt-2 text-4xl font-semibold tracking-[-0.03em] ${textClass}`}>{meta.title || "未命名测试"}</h2>
      )}

      {isEditing ? (
        <InlineEditableTextarea
          value={meta.hook}
          onChange={(v) => update({ hook: v })}
          placeholder="一句吸引人的副标题（可选）"
          className={`mt-3 text-lg leading-7 ${light ? "text-white/70" : "opacity-80"}`}
        />
      ) : (
        meta.hook ? (
          <p className={`mt-3 text-lg leading-7 ${light ? "text-white/70" : "opacity-80"}`}>{meta.hook}</p>
        ) : null
      )}
    </section>
  );
}
