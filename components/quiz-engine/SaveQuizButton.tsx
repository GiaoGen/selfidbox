"use client";

import { useState } from "react";
import { saveQuizSchema } from "@/lib/quizzes-db";
import type { SaveQuizInput } from "@/lib/quizzes-db";

export function SaveQuizButton({ quiz }: { quiz: SaveQuizInput }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [savedSlug, setSavedSlug] = useState("");

  async function handleSave() {
    setStatus("loading");
    setMessage("");

    try {
      const result = await saveQuizSchema(quiz);
      setStatus("success");
      setSavedSlug(result.slug);
      setMessage("测试已保存");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "保存失败");
    }
  }

  return (
    <div className="space-y-4">
      {status === "idle" && (
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--ink)] px-8 text-sm font-semibold text-white transition-shadow hover:shadow-[0_8px_24px_rgba(10,10,10,0.18)]"
        >
          保存这个测试
        </button>
      )}

      {status === "loading" && (
        <div className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--ink)] px-8 text-sm font-semibold text-white opacity-70">
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          保存中...
        </div>
      )}

      {status === "success" && (
        <div className="space-y-3">
          <div className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--ink)] px-8 text-sm font-semibold text-white opacity-70">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            测试已保存
          </div>
          <p className="text-sm text-[var(--body)]">
            Slug:{" "}
            <code className="rounded-md bg-[var(--surface2)] px-2 py-0.5 text-xs font-medium">
              {savedSlug}
            </code>
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--ink)] px-8 text-sm font-semibold text-white transition-shadow hover:shadow-[0_8px_24px_rgba(10,10,10,0.18)]"
          >
            重试保存
          </button>
          <p className="max-w-md text-sm text-red-600">{message}</p>
        </div>
      )}
    </div>
  );
}
