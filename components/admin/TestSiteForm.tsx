"use client";

import { useState } from "react";
import { textColorForNipponBg } from "@/lib/nippon-colors";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
};

function TagInput({ value, onChange }: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-strong)] px-3 py-1 text-sm font-semibold"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-[var(--muted)] hover:text-[var(--ink)]"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="输入标签后回车"
          className="min-w-0 flex-1 rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#b8a4ed]"
        />
        <button
          type="button"
          onClick={addTag}
          className="rounded-[14px] bg-[var(--surface-strong)] px-4 py-2.5 text-sm font-semibold"
        >
          添加
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type FieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

function Field({ label, required, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">
        {label}
        {required && <span className="text-[#ff4d8b] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ */

export type TestSiteFormData = {
  slug: string;
  name: string;
  category_id: string;
  description: string;
  long_description: string;
  url: string;
  logo_url: string;
  cover_image_url: string;
  tags: string[];
  language: string;
  country: string;
  estimated_minutes: number;
  difficulty: string;
  pricing: string;
  supports_email_report: boolean;
  email_report_note: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  sort_order: number;
  color: string;
};

const DIFFICULTIES = ["轻松", "标准", "深入"];
const STATUSES: { value: TestSiteFormData["status"]; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const empty: TestSiteFormData = {
  slug: "",
  name: "",
  category_id: "",
  description: "",
  long_description: "",
  url: "",
  logo_url: "",
  cover_image_url: "",
  tags: [],
  language: "zh",
  country: "CN",
  estimated_minutes: 5,
  difficulty: "标准",
  pricing: "free",
  supports_email_report: false,
  email_report_note: "",
  status: "draft",
  featured: false,
  sort_order: 0,
  color: "",
};

export function TestSiteForm({
  initial,
  categories,
  onSubmit,
  submitLabel = "保存",
}: {
  initial?: Partial<TestSiteFormData>;
  categories: { id: string; name: string }[];
  onSubmit: (data: TestSiteFormData) => Promise<{ success: boolean; error?: unknown }>;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<TestSiteFormData>({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof TestSiteFormData>(
    key: K,
    value: TestSiteFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.slug.trim()) return setError("slug 必填");
    if (!form.name.trim()) return setError("name 必填");
    if (!form.url.trim()) return setError("url 必填");
    if (!form.category_id) return setError("category 必选");

    setSaving(true);
    try {
      const result = await onSubmit(form);
      if (!result.success) {
        setError(JSON.stringify(result.error, null, 2));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#b8a4ed]";
  const selectCls = inputCls;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-[16px] bg-[#ff4d8b]/10 px-4 py-3 text-sm font-semibold text-[#ff4d8b]">
          {error}
        </div>
      )}

      {/* ---- 基本信息 ---- */}
      <fieldset className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-[var(--muted)]">基本信息</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug" required>
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="my-test-site"
            />
          </Field>
          <Field label="Name" required>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="测试名称"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required>
            <select
              className={selectCls}
              value={form.category_id}
              onChange={(e) => update("category_id", e.target.value)}
            >
              <option value="">-- 选择分类 --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="URL" required>
            <input
              className={inputCls}
              value={form.url}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className={inputCls}
            rows={2}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </Field>
        <Field label="Long Description">
          <textarea
            className={inputCls}
            rows={3}
            value={form.long_description}
            onChange={(e) => update("long_description", e.target.value)}
          />
        </Field>
        <Field label="Tags">
          <TagInput
            value={form.tags}
            onChange={(v) => update("tags", v)}
          />
        </Field>
      </fieldset>

      {/* ---- 媒体 ---- */}
      <fieldset className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-[var(--muted)]">媒体</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo URL">
            <input
              className={inputCls}
              value={form.logo_url}
              onChange={(e) => update("logo_url", e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Cover Image URL">
            <input
              className={inputCls}
              value={form.cover_image_url}
              onChange={(e) => update("cover_image_url", e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </div>
      </fieldset>

      {/* ---- 属性 ---- */}
      <fieldset className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-[var(--muted)]">属性</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Estimated Minutes">
            <input
              className={inputCls}
              type="number"
              min={1}
              value={form.estimated_minutes}
              onChange={(e) => update("estimated_minutes", Number(e.target.value))}
            />
          </Field>
          <Field label="Difficulty">
            <select
              className={selectCls}
              value={form.difficulty}
              onChange={(e) => update("difficulty", e.target.value)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Pricing">
            <select
              className={selectCls}
              value={form.pricing}
              onChange={(e) => update("pricing", e.target.value)}
            >
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Language">
            <input
              className={inputCls}
              value={form.language}
              onChange={(e) => update("language", e.target.value)}
            />
          </Field>
          <Field label="Country">
            <input
              className={inputCls}
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </Field>
        </div>
      </fieldset>

      {/* ---- 邮箱报告 ---- */}
      <fieldset className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-[var(--muted)]">邮箱报告</legend>
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={form.supports_email_report}
            onClick={() => update("supports_email_report", !form.supports_email_report)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              form.supports_email_report ? "bg-[#a4d4c5]" : "bg-[var(--hairline)]"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.supports_email_report ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-semibold">
            {form.supports_email_report ? "支持" : "不支持"}
          </span>
        </div>
        {form.supports_email_report && (
          <Field label="Email Report Note">
            <input
              className={inputCls}
              value={form.email_report_note}
              onChange={(e) => update("email_report_note", e.target.value)}
              placeholder="邮箱报告备注..."
            />
          </Field>
        )}
      </fieldset>

      {/* ---- 卡片颜色 ---- */}
      <fieldset className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-[var(--muted)]">卡片颜色</legend>

        <ColorField
          value={form.color}
          onChange={(v) => update("color", v)}
        />
      </fieldset>

      {/* ---- 发布设置 ---- */}
      <fieldset className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <legend className="text-sm font-semibold text-[var(--muted)]">发布设置</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status">
            <select
              className={selectCls}
              value={form.status}
              onChange={(e) => update("status", e.target.value as TestSiteFormData["status"])}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Sort Order">
            <input
              className={inputCls}
              type="number"
              value={form.sort_order}
              onChange={(e) => update("sort_order", Number(e.target.value))}
            />
          </Field>
          <Field label="Featured">
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={form.featured}
                onClick={() => update("featured", !form.featured)}
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  form.featured ? "bg-[#ffb084]" : "bg-[var(--hairline)]"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form.featured ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm font-semibold">
                {form.featured ? "Yes" : "No"}
              </span>
            </div>
          </Field>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-[18px] bg-[var(--ink)] px-6 py-4 text-base font-semibold text-white transition-opacity disabled:opacity-50 sm:w-auto"
      >
        {saving ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Color field: hex input + native picker + reset + live preview      */
/* ------------------------------------------------------------------ */

function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const previewBg = value || "#CCCCCC";
  const previewText = value ? textColorForNipponBg(value) : "#999999";
  const borderColor =
    previewText === "#FCFAF2"
      ? "rgba(255,255,255,0.25)"
      : "rgba(10,10,10,0.15)";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Hex text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#A96369（留空 = 自动取色）"
          pattern="^#[0-9a-fA-F]{6}$"
          className="w-full rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm font-mono outline-none focus:border-[#b8a4ed]"
        />

        {/* Native color picker */}
        <input
          type="color"
          value={value || "#CCCCCC"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-[10px] border border-[var(--hairline)] bg-white p-0.5"
          title="取色器"
        />

        {/* Reset button */}
        <button
          type="button"
          onClick={() => onChange("")}
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
        <hr className="my-3 border-t-2 border-dashed" style={{ borderColor }} />
        <p className="text-sm font-normal leading-6 opacity-60">
          这是卡片的描述文字预览效果。
        </p>
        <hr className="my-3 border-t-2 border-dashed" style={{ borderColor }} />
        <div className="flex items-center justify-between">
          <span className="text-xs font-light opacity-50">标签 · 来源</span>
          <span className="text-xs font-light opacity-50">站外</span>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)]">
        留空则使用自动取色。输入 hex 颜色代码（如 #FF6B6B）覆盖默认颜色。
      </p>
    </div>
  );
}
