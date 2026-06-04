"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import type { QuizMeta } from "@/lib/mock-quiz-engine";
import { InlineEditableInput } from "@/components/quiz-studio/InlineEditableInput";
import { InlineEditableTextarea } from "@/components/quiz-studio/InlineEditableTextarea";

/* ------------------------------------------------------------------ */
/*  Mini StepLabel — plain number + optional help popover                */
/* ------------------------------------------------------------------ */

function StepLabel({ num, label, light, description }: {
  num: number;
  label: string;
  light?: boolean;
  description?: string;
}) {
  const textColor = light ? "text-white" : "text-[var(--ink)]";
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <span className={`shrink-0 text-xl font-semibold tracking-[-0.02em] ${textColor}`}>
        {num}
      </span>
      <h2 className={`text-xl font-semibold tracking-[-0.02em] ${textColor}`}>
        {label}
      </h2>
      {description && (
        <>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className={`shrink-0 rounded-full transition-opacity ${
              light ? "text-white/35 hover:text-white/65" : "text-[var(--ink)]/25 hover:text-[var(--ink)]/50"
            }`}
            title="查看说明"
          >
            <CircleHelp size={15} />
          </button>
          {helpOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setHelpOpen(false)} />
              <div className="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl bg-[var(--surface-card)] p-5 shadow-[0_12px_50px_rgba(10,10,10,0.15)] ring-1 ring-[var(--ink)]/6">
                <p className="text-sm leading-6 text-[var(--body)]">{description}</p>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="mt-3 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                >
                  关闭
                </button>
              </div>
            </>
          )}
        </>
      )}
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
