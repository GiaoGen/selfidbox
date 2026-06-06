"use client";

import { useState, type FormEvent } from "react";

interface QuizEditData {
  title: string;
  description: string;
  cover_image_url: string;
  category_id: string;
  featured: boolean;
  status: string;
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
