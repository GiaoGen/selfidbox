"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReportDetailData, QuizDetailData } from "@/lib/source-detail-db";
import { ReportDetail } from "./ReportDetail";
import { QuizDetail } from "./QuizDetail";

/* ================================================================== */
/*  SourceDetailModal                                                   */
/*                                                                     */
/*  Full-screen modal for viewing report or quiz detail.                */
/*  Matches the DataSourceModal visual style.                           */
/* ================================================================== */

interface Props {
  open: boolean;
  onClose: () => void;
  sourceType: "report" | "quiz";
  sourceId: string;
}

export function SourceDetailModal({ open, onClose, sourceType, sourceId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<ReportDetailData | QuizDetailData | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/profile/source-detail?source_type=${sourceType}&id=${sourceId}`,
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "加载失败");
        return;
      }
      setDetail(data.detail);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [sourceType, sourceId]);

  useEffect(() => {
    if (open) {
      fetchDetail();
    } else {
      setDetail(null);
    }
  }, [open, fetchDetail]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex flex-col bg-[#fffaf0]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 px-5 py-4 sm:px-6 border-b border-[#0a0a0a]/8">
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0a0a0a]/8 transition hover:bg-[#0a0a0a]/15"
            aria-label="返回"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-[#0a0a0a]">
            数据来源详情
          </h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0a0a0a]/15 border-t-[#0a0a0a]/50" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="py-16 text-center">
              <p className="text-sm text-[#0a0a0a]/55">{error}</p>
              <button
                onClick={fetchDetail}
                className="mt-3 rounded-full bg-[#0a0a0a]/8 px-4 py-2 text-sm font-semibold transition hover:bg-[#0a0a0a]/15"
              >
                重试
              </button>
            </div>
          )}

          {/* Content */}
          {!loading && !error && detail && (
            <div className="mx-auto max-w-[640px]">
              {detail.source_type === "report" ? (
                <ReportDetail data={detail as ReportDetailData} />
              ) : (
                <QuizDetail data={detail as QuizDetailData} />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
