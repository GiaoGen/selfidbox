"use client";

import { useState } from "react";

export function SaveQuizButton({
  quiz,
  editMode = false,
  editQuizId,
  accentColor,
}: {
  quiz: Record<string, unknown>;
  editMode?: boolean;
  editQuizId?: string | null;
  accentColor?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "publishing" | "published">("idle");
  const [message, setMessage] = useState("");
  const [savedSlug, setSavedSlug] = useState("");
  const [savedQuizId, setSavedQuizId] = useState("");

  async function handleSave() {
    setStatus("loading");
    setMessage("");

    const body: Record<string, unknown> = { ...quiz };
    if (editMode && editQuizId) {
      body.quizId = editQuizId;
    }

    try {
      const res = await fetch("/api/quiz-studio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setStatus("error");
          setMessage("请先登录后再保存 Quiz。");
        } else {
          setStatus("error");
          setMessage(data.error ?? "保存失败");
        }
        return;
      }

      setStatus("success");
      setSavedSlug(data.slug);
      setSavedQuizId(data.quizId);
      setMessage("测试已保存");
    } catch {
      setStatus("error");
      setMessage("网络错误，请重试");
    }
  }

  async function handlePublishSandbox() {
    setStatus("publishing");
    setMessage("");

    try {
      const res = await fetch("/api/quiz-studio/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: savedQuizId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "发布试玩版失败");
        return;
      }

      setStatus("published");
      setMessage("试玩版已发布");
    } catch {
      setStatus("error");
      setMessage("网络错误，请重试");
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
          {editMode ? "确认编辑" : "保存这个测试"}
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
          {editMode ? "更新中..." : "保存中..."}
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
            {editMode ? "编辑已保存" : "测试已保存"}
          </div>
          {!editMode && (
            <>
              <p className="text-sm text-[var(--body)]">
                Slug:{" "}
                <code className="rounded-md bg-[var(--surface2)] px-2 py-0.5 text-xs font-medium">
                  {savedSlug}
                </code>
              </p>
              <button
                type="button"
                onClick={handlePublishSandbox}
                className="inline-flex h-12 items-center gap-2 rounded-full px-8 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(10,10,10,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(10,10,10,0.15)]"
                style={{ backgroundColor: accentColor || "#0a0a0a" }}
              >
                发布试玩版
              </button>
            </>
          )}
        </div>
      )}

      {status === "publishing" && (
        <div
          className="inline-flex h-12 items-center gap-2 rounded-full px-8 text-sm font-semibold text-white opacity-70"
          style={{ backgroundColor: accentColor || "#0a0a0a" }}
        >
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
          发布中...
        </div>
      )}

      {status === "published" && (
        <div className="space-y-3">
          <div className="inline-flex h-12 items-center gap-2 rounded-full bg-green-600 px-8 text-sm font-semibold text-white">
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
            试玩版已发布
          </div>
          <p className="text-sm text-[var(--body)]">
            分享链接：{" "}
            <code className="rounded-md bg-[var(--surface2)] px-2 py-0.5 text-xs font-medium">
              /quiz/{savedSlug}
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
            {editMode ? "重试编辑" : "重试保存"}
          </button>
          <p className="max-w-md text-sm text-red-600">{message}</p>
        </div>
      )}
    </div>
  );
}
