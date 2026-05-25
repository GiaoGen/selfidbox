"use client";

import type { QuizMeta } from "@/lib/mock-quiz-engine";
import { InlineEditableInput } from "@/components/quiz-studio/InlineEditableInput";
import { InlineEditableTextarea } from "@/components/quiz-studio/InlineEditableTextarea";
import { EditableChipList } from "@/components/quiz-studio/EditableChipList";

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
          placeholder="测试标题"
          className="mt-2 text-4xl font-semibold tracking-[-0.03em]"
        />
      ) : (
        <h2 className="mt-2 text-4xl font-semibold tracking-[-0.03em]">{meta.title}</h2>
      )}

      {isEditing ? (
        <InlineEditableTextarea
          value={meta.hook}
          onChange={(v) => update({ hook: v })}
          placeholder="一句吸引人的副标题"
          className="mt-3 text-lg leading-7 opacity-80"
        />
      ) : (
        <p className="mt-3 text-lg leading-7 opacity-80">{meta.hook}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {isEditing ? (
          <EditableChipList
            items={[meta.quiz_type]}
            onChange={(items) => update({ quiz_type: items[0] ?? meta.quiz_type })}
            placeholder="类型"
          />
        ) : (
          <span className="rounded-full bg-white/35 px-4 py-2 text-sm font-semibold">{meta.quiz_type}</span>
        )}
        {isEditing ? (
          <EditableChipList
            items={meta.audience.split("/").map((s) => s.trim()).filter(Boolean)}
            onChange={(items) => update({ audience: items.join(" / ") || meta.audience })}
            placeholder="受众"
          />
        ) : (
          <span className="rounded-full bg-white/35 px-4 py-2 text-sm font-semibold">{meta.audience}</span>
        )}
        {isEditing ? (
          <EditableChipList
            items={meta.tone.split("/").map((s) => s.trim()).filter(Boolean)}
            onChange={(items) => update({ tone: items.join(" / ") || meta.tone })}
            placeholder="风格"
          />
        ) : (
          <span className="rounded-full bg-white/35 px-4 py-2 text-sm font-semibold">{meta.tone}</span>
        )}
      </div>
    </section>
  );
}
