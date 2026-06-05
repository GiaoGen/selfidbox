"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { X } from "lucide-react";
import type { RankedRuntimeResult } from "@/lib/quiz-runtime";
import { QuizResultShareCard } from "@/components/share/QuizResultShareCard";

type SyncStatus = "idle" | "syncing" | "synced" | "not-authenticated" | "error";

interface Props {
  ranking: RankedRuntimeResult[];
  quizTitle: string;
  quizSlug: string;
  userVector: Record<string, number>;
  syncStatus?: SyncStatus;
  syncError?: string;
  accentColor: string;
}

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const child = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const } },
};

export function QuizResult({ ranking, quizTitle, quizSlug, userVector, syncStatus, syncError, accentColor }: Props) {
  const top = ranking[0];
  const secondary = ranking.slice(1, 3).filter((r) => r.similarity > 0);

  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const saveImage = useCallback(async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = "selfidbox-quiz-result.png";
      link.href = dataUrl;
      link.click();
    } catch {
      // silently fail — the user can still screenshot
    } finally {
      setSaving(false);
    }
  }, []);

  if (!top) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted)]">无法计算结果，请重新测试。</p>
        <a
          href={`/quiz/${quizSlug}`}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white"
        >
          重新测试
        </a>
      </div>
    );
  }

  const resultName = top.result.name || "我的测试结果";
  const resultSubtitle = top.result.subtitle ?? "";
  const resultDescription = top.result.description ?? "";
  const resultImageUrl = top.result.image_url ?? undefined;
  const traits = top.result.traits ?? [];
  const shareText = top.result.share_text ?? "这是我的测试结果，你也来试试。";

  return (
    <>
      <motion.div
        className="mx-auto w-full max-w-[560px]"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Result image */}
        {top.result.image_url && (
          <motion.div variants={child} className="mb-8">
            <div className="overflow-hidden rounded-3xl border border-[var(--ink)]/6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <img
                src={top.result.image_url}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </motion.div>
        )}

        {/* Similarity badge */}
        <motion.div variants={child} className="mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink)]/10 bg-white px-4 py-1.5 text-sm font-medium text-[var(--ink)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M4.5 7.5l2 2 3-4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            匹配度 {top.similarity}%
          </span>
        </motion.div>

        {/* Result name */}
        <motion.h1
          variants={child}
          className="text-[34px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--ink)] sm:text-[40px]"
        >
          {top.result.name}
        </motion.h1>

        {/* Subtitle */}
        {top.result.subtitle && (
          <motion.p
            variants={child}
            className="mt-3 text-lg leading-relaxed text-[var(--muted)]"
          >
            {top.result.subtitle}
          </motion.p>
        )}

        {/* Description */}
        <motion.p
          variants={child}
          className="mt-4 text-[17px] leading-[1.7] text-[var(--body)] sm:text-lg"
        >
          {top.result.description}
        </motion.p>

        {/* Traits */}
        {top.result.traits && top.result.traits.length > 0 && (
          <motion.div variants={child} className="mt-6 flex flex-wrap gap-2">
            {top.result.traits.map((trait) => (
              <span
                key={trait}
                className="rounded-full border border-[var(--ink)]/10 bg-white px-4 py-2 text-sm font-medium text-[var(--ink)]"
              >
                {trait}
              </span>
            ))}
          </motion.div>
        )}

        {/* Secondary results */}
        {secondary.length > 0 && (
          <motion.div variants={child} className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              也可能像
            </p>
            <div className="mt-3 space-y-2">
              {secondary.map((r) => (
                <div
                  key={r.result.id}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--ink)]/6 bg-white px-5 py-3"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--ink)]">{r.result.name}</p>
                    {r.result.subtitle && (
                      <p className="text-sm text-[var(--muted)]">{r.result.subtitle}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-[var(--muted)]">
                    {r.similarity}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div variants={child} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href={`/quiz/${quizSlug}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-8 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            重新测试
          </a>
          <button
            type="button"
            onClick={() => setShowShare(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--ink)]/12 bg-white px-8 py-3.5 text-[15px] font-semibold text-[var(--ink)] transition-all hover:border-[var(--ink)]/25"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M5.5 5.5v4a1 1 0 001 1h4"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 10l4.5-4.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            分享结果
          </button>
        </motion.div>

        {/* Sync status */}
        {syncStatus && syncStatus !== "idle" && (
          <motion.div variants={child} className="mt-6">
            <SyncBanner status={syncStatus} error={syncError} />
          </motion.div>
        )}
      </motion.div>

      {/* ---- share modal ---- */}
      <AnimatePresence>
        {showShare && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ perspective: "1200px" }}
          >
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShare(false)}
              className="absolute inset-0 bg-black/60"
            />

            {/* card + save button — rotateY flip-in */}
            <motion.div
              initial={{ rotateY: -720, scale: 0.9, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1] as const }}
              className="relative z-10 flex w-full flex-col items-center"
              style={{ maxWidth: "calc(100vw - 48px)" }}
            >
              <QuizResultShareCard
                ref={cardRef}
                quizTitle={quizTitle || "SelfIDBox Quiz"}
                resultName={resultName}
                resultSubtitle={resultSubtitle}
                resultDescription={resultDescription}
                resultImageUrl={resultImageUrl}
                traits={traits}
                shareText={shareText}
                cardColor={accentColor}
              />

              {/* save button */}
              <button
                type="button"
                disabled={saving}
                onClick={saveImage}
                className="mt-5 rounded-full bg-white px-8 py-3 text-[15px] font-semibold text-[#1C1C1C] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存图片"}
              </button>
            </motion.div>

            {/* weak close button — top-right corner */}
            <button
              type="button"
              onClick={() => setShowShare(false)}
              className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all hover:bg-white/20 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  SyncBanner                                                         */
/* ------------------------------------------------------------------ */

function SyncBanner({ status, error }: { status: SyncStatus; error?: string }) {
  switch (status) {
    case "syncing":
      return (
        <div className="flex items-center gap-2 rounded-2xl bg-[var(--ink)]/4 px-4 py-3">
          <svg
            className="animate-spin"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="28"
              strokeDashoffset="8"
            />
          </svg>
          <span className="text-sm font-medium text-[var(--ink)]">
            正在同步到个人图谱...
          </span>
        </div>
      );
    case "synced":
      return (
        <div className="flex items-center gap-2 rounded-2xl bg-[#f0fdf4] px-4 py-3">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="8" cy="8" r="6" stroke="#16a34a" strokeWidth="1.2" />
            <path
              d="M5 8l2 2 4-4"
              stroke="#16a34a"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm font-medium text-[#16a34a]">
            已同步到个人图谱
          </span>
        </div>
      );
    case "not-authenticated":
      return (
        <div className="rounded-2xl bg-[var(--surface-card)] px-4 py-4 text-center">
          <p className="text-sm text-[var(--muted)]">
            登录后保存结果到个人图谱
          </p>
          <Link
            href="/login"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-6 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            登录
          </Link>
        </div>
      );
    case "error":
      return (
        <div className="rounded-2xl bg-[#fef2f2] px-4 py-3">
          <p className="text-sm font-medium text-[#dc2626]">
            {error || "同步失败，请稍后重试"}
          </p>
        </div>
      );
    default:
      return null;
  }
}
