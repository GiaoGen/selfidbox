"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, CircleHelp } from "lucide-react";
import type { CreditSnapshot } from "@/lib/credits/service";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EVENT_LABELS: Record<string, string> = {
  base_monthly: "每月保底",
  quiz_completed: "他人完成你的测评",
  quiz_approved: "测评审核通过",
  guest_signup: "游客转化",
  ai_generate: "AI 生成消耗",
};

function eventIcon(type: string): string {
  switch (type) {
    case "base_monthly":
      return "📦";
    case "quiz_completed":
      return "✅";
    case "quiz_approved":
      return "⭐";
    case "guest_signup":
      return "👤";
    case "ai_generate":
      return "🤖";
    default:
      return "•";
  }
}

export function CreditPanel({ open, onClose }: Props) {
  const [data, setData] = useState<CreditSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line
    setLoading(true);
    setError("");
    fetch("/api/credits")
      .then((res) => res.json())
      .then((json) => {
        if (!json.ok) {
          setError(json.error === "NOT_AUTHENTICATED"
            ? "请先登录"
            : "加载失败，请重试");
          setData(null);
        } else {
          setData(json as CreditSnapshot);
        }
      })
      .catch(() => setError("加载失败，请重试"))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <>
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
            className="relative z-10 flex max-h-[85vh] w-full flex-col rounded-t-[32px] bg-[var(--canvas)] shadow-[0_-12px_48px_rgba(10,10,10,0.12)] sm:max-h-[80vh] sm:w-[420px] sm:rounded-[28px] sm:shadow-[0_18px_60px_rgba(10,10,10,0.15)]"
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 sm:px-8 sm:pt-7">
              <div className="flex items-center gap-2.5">
                <Sparkles size={20} className="text-[var(--ink)]" />
                <h2 className="text-lg font-semibold tracking-[-0.01em] text-[var(--ink)]">
                  Credits
                </h2>
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)]/50 transition-colors hover:text-[var(--ink)]"
                  title="如何获得 Credits"
                >
                  <CircleHelp size={15} />
                </button>
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

            {/* content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-8">
              {loading && (
                <div className="flex flex-col items-center gap-3 py-16">
                  <div className="h-[2px] w-24 overflow-hidden rounded-full bg-[var(--ink)]/8">
                    <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-[var(--ink)]" />
                  </div>
                </div>
              )}

              {error && (
                <p className="py-8 text-center text-sm text-red-500">{error}</p>
              )}

              {!loading && !error && data && (
                <>
                  {/* Big number */}
                  <div className="flex flex-col items-center py-6">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                      剩余 Credits
                    </span>
                    <span className="mt-1 text-5xl font-bold tracking-[-0.02em] text-[var(--ink)] tabular-nums">
                      {data.balance.available}
                    </span>
                  </div>

                  {/* Summary bars */}
                  <div className="space-y-2 rounded-[20px] bg-[var(--surface-card)] p-5">
                    <SummaryRow
                      label="每月保底"
                      value={data.balance.base_credits}
                      color="text-[var(--ink)]"
                    />
                    <SummaryRow
                      label="行为奖励"
                      value={data.balance.bonus_credits}
                      color="text-[var(--ink)]"
                    />
                    <SummaryRow
                      label="已消耗"
                      value={-data.balance.used_credits}
                      color="text-[var(--muted)]"
                    />
                    <div className="border-t border-[var(--ink)]/6 pt-2">
                      <SummaryRow
                        label="可用"
                        value={data.balance.available}
                        color="text-[var(--ink)] font-semibold"
                      />
                    </div>
                  </div>

                  {/* Event history */}
                  {data.events.length > 0 && (
                    <>
                      <p className="mt-6 mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                        最近记录
                      </p>
                      <div className="space-y-1">
                        {data.events.slice(0, 20).map((ev, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-[12px] px-3 py-2 text-sm"
                          >
                            <span className="text-[var(--ink)]">
                              {eventIcon(ev.type)}{" "}
                              {EVENT_LABELS[ev.type] ?? ev.type}
                            </span>
                            <span
                              className={`tabular-nums font-medium ${
                                ev.amount >= 0
                                  ? "text-green-600"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              {ev.amount >= 0 ? `+${ev.amount}` : ev.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      {/* ---- 如何获得 Credits 帮助弹窗 ---- */}
      {helpOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-[var(--ink)]/15"
            onClick={() => setHelpOpen(false)}
          />
          {/* card */}
          <div
            className="relative z-10 w-full max-w-sm rounded-2xl bg-[var(--surface-card)] p-6 shadow-[0_18px_60px_rgba(10,10,10,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
              如何获得 Credits
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex gap-3 text-sm leading-relaxed">
                <span className="shrink-0 select-none">📦</span>
                <span>
                  <strong className="text-[var(--ink)]">每月保底</strong>
                  <br />
                  <span className="text-[var(--muted)]">每月自动补充 20 credits</span>
                </span>
              </div>
              <div className="flex gap-3 text-sm leading-relaxed">
                <span className="shrink-0 select-none">✅</span>
                <span>
                  <strong className="text-[var(--ink)]">他人完成你的测评</strong>
                  <br />
                  <span className="text-[var(--muted)]">每个用户完成你的 quiz 获得 +1 credit</span>
                </span>
              </div>
              <div className="flex gap-3 text-sm leading-relaxed">
                <span className="shrink-0 select-none">⭐</span>
                <span>
                  <strong className="text-[var(--ink)]">测评审核通过</strong>
                  <br />
                  <span className="text-[var(--muted)]">管理员发布你的 quiz 获得 +5 credits</span>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="mt-5 w-full rounded-full bg-[var(--ink)] py-2.5 text-sm font-semibold text-white transition-shadow hover:shadow-[0_4px_16px_rgba(10,10,10,0.15)] active:scale-[0.98]"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`tabular-nums ${color}`}>
        {value >= 0 ? `+${value}` : value}
      </span>
    </div>
  );
}
