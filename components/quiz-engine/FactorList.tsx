"use client";

import type { Factor } from "@/lib/mock-quiz-engine";
import { InlineEditableInput } from "@/components/quiz-studio/InlineEditableInput";

type Props = {
  factors: Factor[];
  onChange?: (index: number, factor: Factor) => void;
  onAdd?: () => void;
  onDelete?: (index: number) => void;
};

export function FactorList({ factors, onChange, onAdd, onDelete }: Props) {
  const isEditing = !!onChange;

  return (
    <section className="rounded-[32px] bg-[var(--surface-card)] p-6 sm:p-8">
      <p className="text-sm font-semibold text-[var(--muted)]">Factors</p>
      <p className="mt-2 text-base leading-7 text-[var(--body)]">
        这些影响因子构成了这个测试的人格空间。每个因子都是一个维度，题目选项会在这些维度上移动用户的向量位置。
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {factors.map((f, i) => (
          <span
            key={f.id}
            className="group/factor relative inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            {isEditing ? (
              <InlineEditableInput
                value={f.name}
                onChange={(v) => onChange(i, { ...f, name: v })}
                placeholder="因子名称"
                className="text-sm font-semibold"
              />
            ) : (
              f.name
            )}
            {onDelete && factors.length > 1 && (
              <button
                type="button"
                onClick={() => onDelete(i)}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ink)]/10 text-[0.6rem] leading-none opacity-0 transition-opacity group-hover/factor:opacity-100 hover:bg-[var(--ink)]/20"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-[var(--ink)]/6 px-4 text-sm font-semibold text-[var(--ink)] transition-all hover:bg-[var(--ink)]/12"
          >
            + 添加因子
          </button>
        )}
      </div>
    </section>
  );
}
