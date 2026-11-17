"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { shareCardToPng } from "@/lib/share-card-image";
import { X } from "lucide-react";
import { isSafari } from "@/lib/browser-detect";
import type { RankedRuntimeResult } from "@/lib/quiz-runtime";
import { QuizResultShareCard } from "@/components/share/QuizResultShareCard";
import styles from "./quiz-runtime.module.css";
import { ReceiptPrint } from "@/components/share/ReceiptPrint";

type SyncStatus = "idle" | "syncing" | "synced" | "not-authenticated" | "error";

interface Props {
  ranking: RankedRuntimeResult[];
  quizTitle: string;
  quizSlug: string;
  syncStatus?: SyncStatus;
  syncError?: string;
  accentColor: string;
  createdAt?: string;
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

export function QuizResult({ ranking, quizTitle, quizSlug, syncStatus, syncError, accentColor, createdAt }: Props) {
  const top = ranking[0];
  const secondary = ranking.slice(1, 3).filter((r) => r.similarity > 0);
  const resultImageUrl = top?.result.image_url ?? undefined;

  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failedThumbnailUrls, setFailedThumbnailUrls] = useState<string[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const saveImage = useCallback(async () => {
    const card = cardRef.current;
    if (!card) return;
    setSaving(true);
    try {
      const dataUrl = await shareCardToPng(card);
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

  // Auto-open share card on mount.
  // On Safari/WebKit: wait for the result <img> to finish loading first,
  // so the share card's <img> (same URL) hits the render cache instantly
  // instead of triggering a fresh network request.
  useEffect(() => {
    if (isSafari() && resultImageUrl) {
      const img = document.querySelector<HTMLImageElement>(
        `img[src="${resultImageUrl}"]`,
      );
      if (img && !img.complete) {
        let cancelled = false;
        const timeout = setTimeout(() => {
          if (!cancelled) setShowShare(true);
        }, 1500);
        img.addEventListener(
          "load",
          () => {
            if (!cancelled) {
              clearTimeout(timeout);
              setShowShare(true);
            }
          },
          { once: true },
        );
        return () => {
          cancelled = true;
          clearTimeout(timeout);
        };
      }
      // Safari but image already ready — fall through to immediate open
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowShare(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!top) {
    return (
      <div className={`${styles.receipt} flex flex-col items-center justify-center px-5 py-12`}>
        <p className="text-[var(--muted)]">无法计算结果，请重新测试。</p>
        <a
          href={`/quiz/${quizSlug}`}
          className="mt-4 inline-flex min-h-11 items-center gap-2 bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white"
        >
          重新测试
        </a>
      </div>
    );
  }

  const resultName = top.result.name || "我的测试结果";
  const resultSubtitle = top.result.subtitle ?? "";
  const resultDescription = top.result.description ?? "";
  const traits = top.result.traits ?? [];

  return (
    <>
      <motion.div
        className={`${styles.receipt} mx-auto w-full max-w-[560px] px-5 py-8 sm:px-8 sm:py-10`}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={child} className="mb-6 border-b-2 border-dashed border-[var(--ink)]/15 pb-5">
          <div className="flex items-center justify-between gap-3 text-xs font-medium text-[var(--muted)]">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2 w-2" style={{ backgroundColor: accentColor }} />
              测试结果
            </span>
            <span className="font-mono tracking-wider">SelfIDBox</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-[var(--body)]">{quizTitle}</p>
        </motion.div>

        {/* Result image — full proportion, no crop, no radius */}
        {top.result.image_url && (
          <motion.div variants={child} className="mb-6 flex justify-center border-b border-dashed border-[var(--ink)]/15 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={top.result.image_url}
              alt=""
              className="w-full"
              style={{ objectFit: "contain", maxHeight: 360 }}
            />
          </motion.div>
        )}

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
          <motion.div variants={child} className="mt-6 flex flex-wrap gap-2 border-t border-dashed border-[var(--ink)]/15 pt-5">
            {top.result.traits.map((trait) => (
              <span
                key={trait}
                className="border border-[var(--ink)]/15 bg-[var(--surface-soft)] px-3 py-1.5 text-sm font-medium text-[var(--ink)]"
              >
                {trait}
              </span>
            ))}
          </motion.div>
        )}

        {/* Secondary results */}
        {secondary.length > 0 && (
          <motion.div variants={child} className="mt-6 border-t-2 border-dashed border-[var(--ink)]/15 pt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              也可能像
            </p>
            <div className="mt-2">
              {secondary.map((r) => {
                const imageUrl = r.result.image_url;
                return (
                  <div
                    key={r.result.id}
                    className="flex items-center gap-3 border-b border-dashed border-[var(--ink)]/15 py-3 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1 break-words">
                      <p className="font-semibold text-[var(--ink)]">{r.result.name}</p>
                      {r.result.subtitle && (
                        <p className="text-sm text-[var(--muted)]">{r.result.subtitle}</p>
                      )}
                    </div>
                    {imageUrl && !failedThumbnailUrls.includes(imageUrl) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                        decoding="async"
                        onError={() => setFailedThumbnailUrls((urls) => [...urls, imageUrl])}
                        className="h-12 w-12 shrink-0 object-contain object-right sm:h-14 sm:w-14"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div variants={child} className="mt-6 flex flex-col gap-3 border-t-2 border-dashed border-[var(--ink)]/15 pt-6 sm:flex-row">
          <a
            href={`/quiz/${quizSlug}`}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 bg-[var(--ink)] px-6 py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            重新测试
          </a>
          <button
            type="button"
            onClick={() => setShowShare(true)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-[var(--ink)]/20 px-6 py-3 text-[15px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--ink)]/5"
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
            data-app-overlay className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          >
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShare(false)}
              className="absolute inset-0 bg-black/80"
            />

            {/* card + save button — receipt feed */}
            <ReceiptPrint
              className="relative z-10 max-h-[calc(100cqh-96px)] w-full"
              style={{ maxWidth: "min(560px, calc(100cqw - 48px))" }}
              controls={
                <>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveImage}
                    className="mt-5 min-h-11 shrink-0 bg-white px-8 py-3 text-[15px] font-semibold text-[#1C1C1C] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "保存图片"}
                  </button>

                  {/* Login prompt — shown when user is not authenticated */}
                  {syncStatus === "not-authenticated" && (
                    <a
                      href={`/login?redirect=/profile`}
                      className="mt-3 min-h-11 shrink-0 border border-dashed border-white/30 px-5 py-3 text-center text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      登录 SelfIDBox · 保存所有评测结果
                    </a>
                  )}
                </>
              }
            >
              <QuizResultShareCard
                ref={cardRef}
                quizTitle={quizTitle || "SelfIDBox Quiz"}
                resultName={resultName}
                resultSubtitle={resultSubtitle}
                resultDescription={resultDescription}
                resultImageUrl={resultImageUrl}
                traits={traits}
                cardColor={accentColor}
                createdAt={createdAt}
              />
            </ReceiptPrint>

            {/* weak close button — top-right corner */}
            <button
              type="button"
              onClick={() => setShowShare(false)}
              aria-label="关闭分享"
              className="absolute top-3 right-3 z-20 flex h-11 w-11 items-center justify-center border border-white/20 bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
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
        <div className="flex items-center gap-2 border-y border-dashed border-[var(--ink)]/15 px-4 py-3">
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
        <div className="flex items-center gap-2 border-y border-dashed border-[#16a34a]/25 bg-[#f0fdf4] px-4 py-3">
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
        <div className="border-y border-dashed border-[var(--ink)]/15 px-4 py-4 text-center">
          <p className="text-sm text-[var(--muted)]">
            登录后保存结果到个人图谱
          </p>
          <Link
            href="/login"
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 bg-[var(--ink)] px-6 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            登录
          </Link>
        </div>
      );
    case "error":
      return (
        <div className="border-y border-dashed border-[#dc2626]/25 bg-[#fef2f2] px-4 py-3">
          <p className="text-sm font-medium text-[#dc2626]">
            {error || "同步失败，请稍后重试"}
          </p>
        </div>
      );
    default:
      return null;
  }
}
