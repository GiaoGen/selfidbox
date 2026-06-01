"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { X } from "lucide-react";
import type { RankedRuntimeResult } from "@/lib/quiz-runtime";
import { QuizResultShareCard } from "@/components/share/QuizResultShareCard";

interface Props {
  ranking: RankedRuntimeResult[];
  quizTitle: string;
  quizSlug: string;
  userVector: Record<string, number>;
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

export function QuizResult({ ranking, quizTitle, quizSlug, userVector }: Props) {
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
      </motion.div>

      {/* ---- share modal ---- */}
      <AnimatePresence>
        {showShare && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShare(false)}
              className="absolute inset-0 bg-[var(--ink)]/30 backdrop-blur-sm"
            />

            {/* panel */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] as const }}
              className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-[32px] bg-[var(--canvas)] shadow-[0_-12px_48px_rgba(10,10,10,0.12)] sm:max-h-[85vh] sm:w-[480px] sm:rounded-[28px] sm:shadow-[0_18px_60px_rgba(10,10,10,0.15)]"
            >
              {/* header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 sm:px-7 sm:pt-7">
                <h2 className="text-lg font-semibold tracking-[-0.01em] text-[var(--ink)]">
                  分享结果
                </h2>
                <button
                  type="button"
                  onClick={() => setShowShare(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)]/6 text-[var(--muted)] transition-all hover:bg-[var(--ink)]/12 hover:text-[var(--ink)]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* card preview */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
                <div className="flex justify-center">
                  <QuizResultShareCard
                    ref={cardRef}
                    quizTitle={quizTitle || "SelfIDBox Quiz"}
                    resultName={resultName}
                    resultSubtitle={resultSubtitle}
                    resultDescription={resultDescription}
                    resultImageUrl={resultImageUrl}
                    traits={traits}
                    shareText={shareText}
                  />
                </div>
              </div>

              {/* actions */}
              <div className="flex items-center gap-3 px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
                <button
                  type="button"
                  onClick={() => setShowShare(false)}
                  className="flex-1 rounded-full border border-[var(--ink)]/12 bg-white py-3 text-[15px] font-semibold text-[var(--ink)] transition-all hover:border-[var(--ink)]/25"
                >
                  关闭
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveImage}
                  className="flex-1 rounded-full bg-[var(--ink)] py-3 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "保存中..." : "保存图片"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
