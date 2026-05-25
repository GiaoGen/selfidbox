"use client";

import type { QuizMeta } from "@/lib/mock-quiz-engine";
import { InlineEditableInput } from "@/components/quiz-studio/InlineEditableInput";
import { InlineEditableTextarea } from "@/components/quiz-studio/InlineEditableTextarea";

type Props = {
  meta: QuizMeta;
  onChange?: (patch: Partial<QuizMeta>) => void;
};

export function QuizMetaCard({ meta, onChange }: Props) {
  const isEditing = !!onChange;
  const update = onChange ?? (() => {});

  return (
    <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_62%,#fffaf0_100%)] p-6 shadow-[0_18px_50px_rgba(10,10,10,0.08)] sm:p-8 text-white">
      <p className="text-sm font-semibold opacity-70">Quiz Meta</p>

      {isEditing ? (
        <InlineEditableInput
          value={meta.title}
          onChange={(v) => update({ title: v })}
          placeholder="输入测试标题"
          className="mt-2 text-4xl font-semibold tracking-[-0.03em]"
        />
      ) : (
        <h2 className="mt-2 text-4xl font-semibold tracking-[-0.03em]">{meta.title || "未命名测试"}</h2>
      )}

      {isEditing ? (
        <InlineEditableTextarea
          value={meta.hook}
          onChange={(v) => update({ hook: v })}
          placeholder="一句吸引人的副标题（可选）"
          className="mt-3 text-lg leading-7 opacity-80"
        />
      ) : (
        meta.hook ? (
          <p className="mt-3 text-lg leading-7 opacity-80">{meta.hook}</p>
        ) : null
      )}
    </section>
  );
}
