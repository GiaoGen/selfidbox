"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Library, EyeOff, Play, Send, Trash2, Pencil, Share2 } from "lucide-react";
import type { CreatorQuizRow } from "@/lib/quizzes-db";
import { MAX_SANDBOX_ATTEMPTS } from "@/lib/quiz-runtime";
import { QuizSwipeActionRow, type ActionButton } from "./QuizSwipeActionRow";

interface Props {
  open: boolean;
  onClose: () => void;
}

function statusLabel(s: string): string {
  if (s === "published") return "已发布";
  if (s === "sandbox") return "沙盒";
  if (s === "submitted") return "已提交";
  return "草稿";
}

function statusBadgeClass(s: string): string {
  if (s === "published") return "bg-green-100 text-green-700";
  if (s === "sandbox") return "bg-blue-100 text-blue-700";
  if (s === "submitted") return "bg-orange-100 text-orange-700";
  return "bg-[var(--ink)]/6 text-[var(--muted)]";
}

const BTN_ICON_SIZE = 14;

export function MyQuizzesModal({ open, onClose }: Props) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<CreatorQuizRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [copyMsg, setCopyMsg] = useState("");

  /* ---- Fetch ---- */
  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/my-quizzes");
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
    } catch {
      setError("加载失败，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line
    fetchQuizzes();
  }, [open, fetchQuizzes]);

  /* ---- Status change ---- */
  async function handleStatusChange(quizId: string, newStatus: string) {
    setActionMsg("");
    try {
      const res = await fetch("/api/my-quizzes/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.error ?? "操作失败");
        return;
      }
      // Optimistic-ish: update local state
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, status: newStatus } : q)),
      );
    } catch {
      setActionMsg("网络错误，请重试");
    }
  }

  /* ---- Delete ---- */
  async function handleDelete(quizId: string) {
    setActionMsg("");
    try {
      const res = await fetch("/api/my-quizzes/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.error ?? "删除失败");
        return;
      }
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch {
      setActionMsg("网络错误，请重试");
    }
  }

  /* ---- Build action buttons per quiz status ---- */
  function buildButtons(quiz: CreatorQuizRow): ActionButton[] {
    // archived not in scope — no swipe actions
    if (quiz.status === "archived") return [];

    const all: ActionButton[] = [];

    // 分享 (sandbox / submitted / published — draft excluded)
    if (quiz.status !== "draft") {
      all.push({
        key: "share",
        label: "分享",
        icon: <Share2 size={BTN_ICON_SIZE} />,
        bgClass: "bg-emerald-100 text-emerald-600",
        hoverClass: "hover:bg-emerald-200",
        onClick: () => handleShare(quiz),
      });
    }

    // published only gets share — no edit / delete
    if (quiz.status === "published") return all;

    // 编辑 (draft / sandbox / submitted)
    all.push({
      key: "edit",
      label: "编辑",
      icon: <Pencil size={BTN_ICON_SIZE} />,
      bgClass: "bg-violet-100 text-violet-600",
      hoverClass: "hover:bg-violet-200",
      onClick: () => {
        if (quiz.slug || quiz.id) {
          router.push(`/create?quiz_id=${quiz.id}`);
          onClose();
        }
      },
    });

    // 隐藏 → draft (only from sandbox)
    if (quiz.status === "sandbox") {
      all.push({
        key: "draft",
        label: "隐藏",
        icon: <EyeOff size={BTN_ICON_SIZE} />,
        bgClass: "bg-gray-100 text-gray-600",
        hoverClass: "hover:bg-gray-200",
        onClick: () => handleStatusChange(quiz.id, "draft"),
      });
    }

    // 试玩 → sandbox (only from draft)
    if (quiz.status === "draft") {
      all.push({
        key: "sandbox",
        label: "试玩",
        icon: <Play size={BTN_ICON_SIZE} />,
        bgClass: "bg-blue-100 text-blue-600",
        hoverClass: "hover:bg-blue-200",
        onClick: () => handleStatusChange(quiz.id, "sandbox"),
      });
    }

    // 提交审核 → submitted (only from sandbox)
    if (quiz.status === "sandbox") {
      all.push({
        key: "submitted",
        label: "提交审核",
        icon: <Send size={BTN_ICON_SIZE} />,
        bgClass: "bg-orange-100 text-orange-600",
        hoverClass: "hover:bg-orange-200",
        onClick: () => handleStatusChange(quiz.id, "submitted"),
      });
    }

    // 删除 (draft / sandbox / submitted)
    all.push({
      key: "delete",
      label: "删除",
      icon: <Trash2 size={BTN_ICON_SIZE} />,
      bgClass: "bg-red-100 text-red-600",
      hoverClass: "hover:bg-red-200",
      onClick: () => handleDelete(quiz.id),
    });

    return all;
  }

  /* ---- Share (copy link) ---- */
  async function handleShare(quiz: CreatorQuizRow) {
    const url = `${window.location.origin}/quiz/${quiz.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyMsg("链接已复制到剪贴板！");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch {
      setActionMsg("复制失败，请重试");
    }
  }

  function handleNavigate(quiz: CreatorQuizRow) {
    if (!quiz.slug) {
      setActionMsg("该测试缺少 slug，无法跳转");
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
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)]/6 text-[var(--muted)] transition-colors hover:bg-[var(--ink)]/12 hover:text-[var(--ink)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* divider */}
            <div className="mx-6 border-t border-[var(--ink)]/6 sm:mx-8" />

            {/* action feedback */}
            {actionMsg && (
              <div className="mx-6 mt-3 sm:mx-8">
                <p className="rounded-xl bg-[#fef2f2] px-4 py-2 text-[13px] font-medium text-[#dc2626]">
                  {actionMsg}
                </p>
              </div>
            )}
            {copyMsg && (
              <div className="mx-6 mt-3 sm:mx-8">
                <p className="rounded-xl bg-[#f0fdf4] px-4 py-2 text-[13px] font-medium text-[#16a34a]">
                  {copyMsg}
                </p>
              </div>
            )}

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
                  <QuizSwipeActionRow
                    key={quiz.id}
                    buttons={buildButtons(quiz)}
                    isOpen={openSwipeId === quiz.id}
                    onOpenChange={(open) =>
                      setOpenSwipeId(open ? quiz.id : null)
                    }
                    className="mb-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleNavigate(quiz)}
                      className="w-full border border-[var(--ink)]/8 bg-[#FFF5EC] px-5 py-4 text-left transition-shadow transition-transform hover:border-[var(--ink)]/20 hover:shadow-[0_4px_16px_rgba(10,10,10,0.04)] active:scale-[0.99]"
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
                          className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${statusBadgeClass(quiz.status)}`}
                        >
                          {statusLabel(quiz.status)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--muted)]">
                        <span>
                          {new Date(quiz.created_at).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                        {quiz.status === "sandbox" && (
                          <span className="font-medium">
                            试玩 {quiz.attempt_count ?? 0} / {MAX_SANDBOX_ATTEMPTS}
                          </span>
                        )}
                      </div>
                    </button>
                  </QuizSwipeActionRow>
                ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
