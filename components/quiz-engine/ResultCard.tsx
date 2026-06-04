"use client";

import { useRef, useState } from "react";
import { Pin, PinOff, Image, Loader } from "lucide-react";
import type { Result } from "@/lib/mock-quiz-engine";
import { uploadResultImage } from "@/lib/image-upload";
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
  cardColor?: string;
};

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

export function ResultCard({ result, index, onChange, onDelete, onTogglePin, cardColor }: Props) {
  const hasColor = !!cardColor;
  const darkText = hasColor && isLight(cardColor!);
  const colorClass = hasColor
    ? ""
    : COLORS[index % COLORS.length];
  const cardStyle = hasColor
    ? { backgroundColor: cardColor, color: darkText ? "var(--ink)" : "#ffffff" } as React.CSSProperties
    : undefined;

  const isEditing = !!onChange;
  const update = onChange ?? (() => {});
  const pinned = result.isPinned;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<"idle" | "loading" | "error">("idle");

  const btnBase = "flex h-7 w-7 items-center justify-center rounded-full transition-all";
  const btnVisible = hasColor
    ? darkText ? "bg-black/10 text-[var(--ink)]/70 hover:bg-black/20 hover:text-[var(--ink)]" : "bg-white/20 text-current/80 hover:bg-white/35 hover:text-current"
    : "bg-white/20 text-current/80 hover:bg-white/35 hover:text-current";
  const pinActive = hasColor
    ? darkText ? "bg-black/15 text-[var(--ink)]" : "bg-white/30 text-current"
    : "bg-white/30 text-current";

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadState("loading");
    try {
      const { image_url } = await uploadResultImage(file, result.id);
      update({ ...result, image_url });
      setUploadState("idle");
    } catch {
      setUploadState("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const opacityClass = hasColor ? (darkText ? "opacity-50" : "opacity-60") : "opacity-50";
  const descClass = hasColor ? (darkText ? "opacity-70" : "opacity-80") : "opacity-80";

  return (
    <article
      className={`rounded-[28px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.07)] ${colorClass} relative group/card transition-shadow ${
        pinned ? "ring-2 ring-white/40 shadow-[0_0_24px_rgba(255,255,255,0.18)]" : ""
      }`}
      style={cardStyle}
    >
      <div className="absolute right-3 top-3 flex items-center gap-0.5">
        {isEditing && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleUploadClick}
              className={`${btnBase} ${btnVisible}`}
              title="上传图片"
              disabled={uploadState === "loading"}
            >
              {uploadState === "loading" ? (
                <Loader size={13} className="animate-spin" />
              ) : uploadState === "error" ? (
                <Image size={13} className="opacity-50" />
              ) : (
                <Image size={13} />
              )}
            </button>
          </>
        )}
        {onTogglePin && (
          <button
            type="button"
            onClick={onTogglePin}
            className={`${btnBase} ${
              pinned ? pinActive : btnVisible
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

      {/* image preview */}
      {result.image_url && (
        <div className="mb-4 overflow-hidden rounded-2xl">
          <img
            src={result.image_url}
            alt=""
            className="aspect-[16/10] w-full object-cover"
          />
        </div>
      )}

      {/* subtitle */}
      {isEditing ? (
        <InlineEditableInput
          value={result.subtitle ?? ""}
          onChange={(v) => update({ ...result, subtitle: v })}
          placeholder="副标题"
          className={`text-xs font-semibold ${opacityClass}`}
        />
      ) : result.subtitle ? (
        <p className={`text-xs font-semibold ${opacityClass}`}>{result.subtitle}</p>
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
          className={`mt-3 text-sm leading-6 ${descClass}`}
        />
      ) : (
        <p className={`mt-3 text-sm leading-6 ${descClass}`}>{result.description}</p>
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
            className={`w-full text-xs ${opacityClass}`}
          />
        </div>
      )}

      {/* upload error feedback */}
      {uploadState === "error" && (
        <p className={`mt-2 text-xs ${opacityClass}`}>上传失败，请重试</p>
      )}
    </article>
  );
}
