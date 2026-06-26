"use client";

import { useState, type FormEvent } from "react";
import { textColorForNipponBg } from "@/lib/nippon-colors";

interface QuizEditData {
  title: string;
  description: string;
  cover_image_url: string;
  category_id: string;
  featured: boolean;
  status: string;
  color: string;
}

interface Props {
  initial: QuizEditData;
  categories: { id: string; name: string }[];
  onSubmit: (
    data: QuizEditData,
  ) => Promise<{ success: boolean; error?: unknown } | void>;
}

export function QuizEditForm({ initial, categories, onSubmit }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data: QuizEditData = {
      title: (formData.get("title") as string) ?? "",
      description: (formData.get("description") as string) ?? "",
      cover_image_url: (formData.get("cover_image_url") as string) ?? "",
      category_id: (formData.get("category_id") as string) ?? "",
      featured: formData.get("featured") === "on",
      status: (formData.get("status") as string) ?? "draft",
      color: (formData.get("color") as string) ?? "",
    };

    try {
      const result = await onSubmit(data);
      if (result && !result.success) {
        setError(result.error instanceof Error ? result.error.message : "保存失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#b8a4ed]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-[16px] bg-[#fef2f2] px-5 py-3 text-sm font-medium text-[#dc2626]">
          {error}
        </div>
      )}

      {/* ── Basic info ── */}
      <fieldset className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-[var(--muted)]">
          基本信息
        </legend>

        <Field label="Title" required>
          <input
            name="title"
            defaultValue={initial.title}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            defaultValue={initial.description}
            rows={3}
            className={inputClass}
          />
        </Field>

        <Field label="Cover Image URL">
          <input
            name="cover_image_url"
            defaultValue={initial.cover_image_url}
            placeholder="https://…"
            className={inputClass}
          />
          {initial.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={initial.cover_image_url}
              alt=""
              className="mt-2 h-24 rounded-[12px] object-cover"
            />
          )}
        </Field>
      </fieldset>

      {/* ── Category & Featured ── */}
      <fieldset className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-[var(--muted)]">
          分类 & 精选
        </legend>

        <Field label="Category">
          <select
            name="category_id"
            defaultValue={initial.category_id}
            className={inputClass}
          >
            <option value="">— 无 —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Featured">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              name="featured"
              type="checkbox"
              defaultChecked={initial.featured}
              className="h-4 w-4 rounded accent-[#b8a4ed]"
            />
            <span className="text-sm">精选 Quiz</span>
          </label>
        </Field>
      </fieldset>

      {/* ── 卡片颜色 ── */}
      <fieldset className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-[var(--muted)]">
          卡片颜色
        </legend>

        <ColorInput name="color" defaultValue={initial.color} />
      </fieldset>

      {/* ── Status ── */}
      <fieldset className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-[var(--muted)]">
          状态
        </legend>

        <Field label="Status">
          <select
            name="status"
            defaultValue={initial.status}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="sandbox">Sandbox</option>
            <option value="submitted">Submitted</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </Field>

        <p className="text-xs text-[var(--muted)]">
          Quiz Studio 负责管理题目、选项和结果。此页面仅编辑元数据。
        </p>
      </fieldset>

      {/* ── Submit ── */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[16px] bg-[var(--ink)] px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存修改"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">
        {label}
        {required && <span className="ml-0.5 text-[#dc2626]">*</span>}
      </span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Color input with hex field + native picker + reset + live preview  */
/* ------------------------------------------------------------------ */

function ColorInput({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue || "");

  // Derive readable text color for preview
  const previewBg = value || "#CCCCCC";
  const previewText = value ? textColorForNipponBg(value) : "#999";

  function handleReset() {
    setValue("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Hex text input */}
        <input
          name={name}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#A96369（留空 = 自动取色）"
          pattern="^#[0-9a-fA-F]{6}$"
          className="w-full rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm font-mono outline-none focus:border-[#b8a4ed]"
        />

        {/* Native color picker */}
        <input
          type="color"
          value={value || "#CCCCCC"}
          onChange={(e) => setValue(e.target.value)}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-[10px] border border-[var(--hairline)] bg-white p-0.5"
          title="取色器"
        />

        {/* Reset button */}
        <button
          type="button"
          onClick={handleReset}
          disabled={!value}
          className="shrink-0 rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)] disabled:opacity-30"
          title="恢复默认颜色"
        >
          ↺
        </button>
      </div>

      {/* Live preview */}
      <div
        className="rounded-[18px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.10)] transition-colors"
        style={{ backgroundColor: previewBg, color: previewText }}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-base font-semibold">卡片预览</span>
          <span className="shrink-0 pt-0.5 text-xs font-light opacity-50">分类</span>
        </div>
        <hr
          className="my-3 border-t-2 border-dashed"
          style={{ borderColor: previewText === "#FCFAF2" ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.15)" }}
        />
        <p className="text-sm font-normal leading-6 opacity-60">
          这是卡片的描述文字预览效果。
        </p>
        <hr
          className="my-3 border-t-2 border-dashed"
          style={{ borderColor: previewText === "#FCFAF2" ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.15)" }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs font-light opacity-50">标签 · 来源</span>
          <span className="text-xs font-light opacity-50">SelfIDBox</span>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)]">
        留空则使用自动取色。输入 hex 颜色代码（如 #FF6B6B）覆盖默认颜色。
      </p>
    </div>
  );
}
