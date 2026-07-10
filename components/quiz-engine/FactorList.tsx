"use client";

import { Pin, PinOff } from "lucide-react";
import type { Factor } from "@/lib/mock-quiz-engine";

type Props = {
  factors: Factor[];
  onChange?: (index: number, factor: Factor) => void;
  onAdd?: () => void;
  onDelete?: (index: number) => void;
  onTogglePin?: (index: number) => void;
  bgColor?: string;
  noCard?: boolean;
};

const btnBase = "flex h-5 w-5 items-center justify-center rounded-full transition-colors";
const btnVisible = "bg-black/8 text-[var(--ink)]/60 hover:bg-black/16 hover:text-[var(--ink)]";

export function FactorList({ factors, onAdd, onDelete, onTogglePin, bgColor, noCard }: Props) {
  const content = (
    <>
      {!noCard && <p className="text-sm font-semibold text-[var(--muted)]">Factors</p>}
      {!noCard && (
        <p className="mt-2 text-base leading-7 text-[var(--body)]">
          这些影响因子构成了这个测试的人格空间。每个因子都是一个维度，题目选项会在这些维度上移动用户的向量位置。
        </p>
      )}
      <div className={`flex flex-wrap gap-3 ${noCard ? "" : "mt-5"}`}>
        {factors.map((f, i) => {
          const pinned = f.isPinned;
          return (
            <span
              key={f.id}
              className={`group/factor relative inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-shadow ${
                pinned ? "ring-2 ring-[var(--ink)]/15 shadow-[0_0_12px_rgba(10,10,10,0.06)]" : ""
              }`}
            >
              {f.name}
              <span className="flex items-center gap-0.5 ml-0.5">
                {onTogglePin && (
                  <button
                    type="button"
                    onClick={() => onTogglePin(i)}
                    className={`${btnBase} ${
                      pinned
                        ? "bg-[var(--ink)]/12 text-[var(--ink)]"
                        : btnVisible
                    }`}
                    title={pinned ? "取消固定" : "固定此因子"}
                  >
                    {pinned ? <Pin size={11} fill="currentColor" /> : <PinOff size={11} />}
                  </button>
                )}
                {onDelete && factors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDelete(i)}
                    className={`${btnBase} ${btnVisible}`}
                    title="删除"
                  >
                    ×
                  </button>
                )}
              </span>
            </span>
          );
        })}
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)]/6 text-sm font-semibold text-[var(--ink)] transition-colors transition-transform hover:bg-[var(--ink)]/12 active:scale-95"
            title="添加因子"
          >
            +
          </button>
        )}
      </div>
    </>
  );

  if (noCard) return content;

  return (
    <section
      className="rounded-[32px] p-6 sm:p-8"
      style={{ backgroundColor: bgColor ? `${bgColor}12` : "var(--surface-card)" }}
    >
      {content}
    </section>
  );
}
