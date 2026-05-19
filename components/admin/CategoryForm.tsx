"use client";

import { useState } from "react";

export type CategoryFormData = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  status: string;
};

const STATUSES = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const empty: CategoryFormData = {
  slug: "",
  name: "",
  description: "",
  icon: "",
  sort_order: 0,
  status: "published",
};

export function CategoryForm({
  initial,
  onSubmit,
  submitLabel = "保存",
}: {
  initial?: Partial<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<CategoryFormData>({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.slug.trim()) return setError("slug 必填");
    if (!form.name.trim()) return setError("name 必填");

    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#b8a4ed]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-[16px] bg-[#ff4d8b]/10 px-4 py-3 text-sm font-semibold text-[#ff4d8b]">
          {error}
        </div>
      )}

      <div className="space-y-4 rounded-[24px] bg-white/60 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">
              Slug<span className="text-[#ff4d8b] ml-0.5">*</span>
            </span>
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="personality"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">
              Name<span className="text-[#ff4d8b] ml-0.5">*</span>
            </span>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="人格测试"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">Description</span>
          <textarea
            className={inputCls}
            rows={2}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Icon</span>
            <input
              className={inputCls}
              value={form.icon}
              onChange={(e) => update("icon", e.target.value)}
              placeholder="🧠"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Sort Order</span>
            <input
              className={inputCls}
              type="number"
              value={form.sort_order}
              onChange={(e) => update("sort_order", Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">Status</span>
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

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
