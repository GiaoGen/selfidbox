"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Library } from "lucide-react";
import type { CreatorQuizRow } from "@/lib/quizzes-db";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MyQuizzesModal({ open, onClose }: Props) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<CreatorQuizRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    fetch("/api/my-quizzes")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            setError("请先登录后查看你创建的 Quiz。");
          } else {
            setError(data.error ?? "加载失败，请重试");
          }
          setQuizzes([]);
          return;
        }
        setQuizzes(data.quizzes ?? []);
      })
      .catch(() => setError("加载失败，请重试"))
      .finally(() => setLoading(false));
  }, [open]);

  function handleClick(quiz: CreatorQuizRow) {
    if (!quiz.slug) {
      setError("该测试缺少 slug，无法跳转");
      return;
    }
    router.push(`/quiz/${quiz.slug}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--ink)]/20 backdrop-blur-sm"
          />

          {/* panel */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] as const }}
            className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-[32px] bg-[var(--canvas)] shadow-[0_-12px_48px_rgba(10,10,10,0.12)] sm:max-h-[80vh] sm:w-[560px] sm:rounded-[28px] sm:shadow-[0_18px_60px_rgba(10,10,10,0.15)]"
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 sm:px-8 sm:pt-7">
              <div className="flex items-center gap-2.5">
                <Library size={20} className="text-[var(--ink)]" />
                <h2 className="text-lg font-semibold tracking-[-0.01em] text-[var(--ink)]">
                  创建过的 Quiz
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)]/6 text-[var(--muted)] transition-all hover:bg-[var(--ink)]/12 hover:text-[var(--ink)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* divider */}
            <div className="mx-6 border-t border-[var(--ink)]/6 sm:mx-8" />

            {/* content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-8">
              {loading && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="h-[2px] w-24 overflow-hidden rounded-full bg-[var(--ink)]/8">
                    <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-[var(--ink)]" />
                  </div>
                  <p className="text-sm text-[var(--muted)]">加载中...</p>
                </div>
              )}

              {error && (
                <p className="py-8 text-center text-sm text-red-500">{error}</p>
              )}

              {!loading && !error && quizzes.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Library size={28} className="text-[var(--muted)]" />
                  <p className="text-sm text-[var(--muted)]">
                    还没有创建过 Quiz。
                  </p>
                </div>
              )}

              {!loading &&
                quizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    type="button"
                    onClick={() => handleClick(quiz)}
                    className="mb-2 w-full rounded-2xl border border-[var(--ink)]/8 bg-white px-5 py-4 text-left transition-all hover:border-[var(--ink)]/20 hover:shadow-[0_4px_16px_rgba(10,10,10,0.04)] active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[15px] font-semibold text-[var(--ink)]">
                          {quiz.title}
                        </h3>
                        {quiz.hook && (
                          <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                            {quiz.hook}
                          </p>
                        )}
                      </div>
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          quiz.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-[var(--ink)]/6 text-[var(--muted)]"
                        }`}
                      >
                        {quiz.status === "published" ? "已发布" : quiz.status}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-[var(--muted)]">
                      {new Date(quiz.created_at).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </button>
                ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
