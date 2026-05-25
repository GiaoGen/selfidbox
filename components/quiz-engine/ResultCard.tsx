"use client";

import { Pin, PinOff } from "lucide-react";
import type { Result } from "@/lib/mock-quiz-engine";
import { InlineEditableInput } from "@/components/quiz-studio/InlineEditableInput";
import { InlineEditableTextarea } from "@/components/quiz-studio/InlineEditableTextarea";
import { EditableChipList } from "@/components/quiz-studio/EditableChipList";

const COLORS = [
  "bg-[#ffb084] text-[#0a0a0a]",
  "bg-[#ff4d8b] text-white",
  "bg-[#b8a4ed] text-[#0a0a0a]",
  "bg-[#e8b94a] text-[#0a0a0a]",
  "bg-[#1a3a3a] text-white",
];

type Props = {
  result: Result;
  index: number;
  onChange?: (result: Result) => void;
  onDelete?: () => void;
  onTogglePin?: () => void;
};

export function ResultCard({ result, index, onChange, onDelete, onTogglePin }: Props) {
  const color = COLORS[index % COLORS.length];
  const isEditing = !!onChange;
  const update = onChange ?? (() => {});
  const pinned = result.isPinned;

  const btnBase = "flex h-7 w-7 items-center justify-center rounded-full transition-all";
  const btnVisible = "bg-white/20 text-current/80 hover:bg-white/35 hover:text-current";

  return (
    <article
      className={`rounded-[28px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.07)] ${color} relative group/card transition-shadow ${
        pinned ? "ring-2 ring-white/40 shadow-[0_0_24px_rgba(255,255,255,0.18)]" : ""
      }`}
    >
      <div className="absolute right-3 top-3 flex items-center gap-0.5">
        {onTogglePin && (
          <button
            type="button"
            onClick={onTogglePin}
            className={`${btnBase} ${
              pinned
                ? "bg-white/30 text-current"
                : btnVisible
            }`}
            title={pinned ? "取消固定" : "固定此结果"}
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

      {/* subtitle */}
      {isEditing ? (
        <InlineEditableInput
          value={result.subtitle ?? ""}
          onChange={(v) => update({ ...result, subtitle: v })}
          placeholder="副标题"
          className="text-xs font-semibold opacity-50"
        />
      ) : result.subtitle ? (
        <p className="text-xs font-semibold opacity-50">{result.subtitle}</p>
      ) : null}

      {/* name */}
      {isEditing ? (
        <InlineEditableInput
          block
          value={result.name}
          onChange={(v) => update({ ...result, name: v })}
          placeholder="结果名称"
          className="mt-1 text-2xl font-semibold tracking-[-0.02em]"
        />
      ) : (
        <h3 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{result.name}</h3>
      )}

      {isEditing ? (
        <InlineEditableTextarea
          value={result.description}
          onChange={(v) => update({ ...result, description: v })}
          placeholder="结果描述…"
          className="mt-3 text-sm leading-6 opacity-80"
        />
      ) : (
        <p className="mt-3 text-sm leading-6 opacity-80">{result.description}</p>
      )}

      <div className="mt-4">
        {isEditing ? (
          <EditableChipList
            items={result.traits}
            onChange={(traits) => update({ ...result, traits })}
            placeholder="添加特质"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {result.traits.map((trait) => (
              <span key={trait} className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold">
                {trait}
              </span>
            ))}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-3">
          <InlineEditableInput
            value={result.shareText ?? ""}
            onChange={(v) => update({ ...result, shareText: v })}
            placeholder="分享文案（可选）"
            className="w-full text-xs opacity-50"
          />
        </div>
      )}
    </article>
  );
}
