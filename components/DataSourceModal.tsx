"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ScreenshotReportUploader } from "@/components/profile/ScreenshotReportUploader";
import { SwipeToDeleteSourceRow } from "@/components/profile/SwipeToDeleteSourceRow";
import { RotatingCardModal } from "@/components/share/RotatingCardModal";
import { QuizResultShareCard } from "@/components/share/QuizResultShareCard";
import { useSourceCardOpen } from "@/components/profile/useSourceCardOpen";
import type { ProfileSourceEntry } from "@/lib/user-profile-db";
import type { ReportDetailData, QuizDetailData } from "@/lib/source-detail-db";

export type { ProfileSourceEntry } from "@/lib/user-profile-db";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso.slice(0, 10);
  }
}

export function DataSourceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [sources, setSources] = useState<ProfileSourceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---- Delete state ---- */
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  /* ---- Card modal (shared hook: cache + three-tier fetch) ---- */
  const { cardOpen, cardLoading, cardData, cardType, openCard, closeCard } = useSourceCardOpen();

  /* Auto-dismiss feedback after 3 seconds */
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/sources");
      const data = await res.json();
      if (data.ok) {
        setSources(data.sources);
      } else {
        setError(data.error || "加载失败");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line
      fetchSources();
      setOpenSwipeId(null);
      setConfirmingId(null);
      setFeedback(null);
    }
  }, [open, fetchSources]);

  /* ---- Preload images when modal opens (non-blocking) ---- */
  useEffect(() => {
    if (!open || sources.length === 0) return;
    for (const src of sources) {
      if (src.image_url) {
        const img = new Image();
        img.src = src.image_url;
      }
    }
  }, [open, sources]);

  /* ---- Delete handlers ---- */

  const handleRequestConfirm = useCallback((entry: ProfileSourceEntry) => {
    setConfirmingId(entry.id);
    setOpenSwipeId(entry.id);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!confirmingId) return;

    const target = sources.find((s) => s.id === confirmingId);
    if (!target) return;

    // Optimistic: remove row instantly
    setSources((prev) => prev.filter((s) => s.id !== target.id));
    setConfirmingId(null);
    setOpenSwipeId(null);
    setFeedback({ type: "success", message: "删除完成" });

    // Fire and forget API call
    fetch("/api/profile/sources/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_type: target.source_type,
        id: target.id,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!data.ok) {
          setFeedback({
            type: "error",
            message: data.error || "删除失败，请重试",
          });
        }
      })
      .catch((err) => {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "网络错误，请重试",
        });
      });
  }, [confirmingId, sources]);

  /* ---- Source item click → open card (via shared hook) ---- */
  const handleSourceClick = useCallback((entry: ProfileSourceEntry) => {
    openCard(entry);
  }, [openCard]);

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
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="flex h-full w-full flex-col bg-[#fffaf0] text-[#0a0a0a] md:h-auto md:max-h-[80vh] md:w-[720px] md:rounded-[32px] md:shadow-[0_24px_64px_rgba(10,10,10,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---- Header ---- */}
        <div className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-6">
          <h2 className="text-xl font-semibold">数据来源</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-[#0a0a0a]/8 p-2 transition hover:bg-[#0a0a0a]/15"
            aria-label="关闭"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ---- Body ---- */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
          {/* Upload toggle */}
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#0a0a0a]/8 px-4 py-2 text-sm font-semibold transition hover:bg-[#0a0a0a]/15"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {showUpload ? "收起上传" : "上传测评截图"}
          </button>

          {showUpload && (
            <div className="mb-4">
              <ScreenshotReportUploader />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0a0a0a]/15 border-t-[#0a0a0a]/50" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="py-12 text-center">
              <p className="text-sm text-[#0a0a0a]/55">{error}</p>
              <button
                onClick={fetchSources}
                className="mt-3 rounded-full bg-[#0a0a0a]/8 px-4 py-2 text-sm font-semibold transition hover:bg-[#0a0a0a]/15"
              >
                重试
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && sources.length === 0 && (
            <div className="py-12 text-center text-sm text-[#0a0a0a]/45">
              还没有数据来源。
            </div>
          )}

          {/* Source rows */}
          {!loading && !error && sources.length > 0 && (
            <div className="divide-y divide-[#0a0a0a]/10">
              {sources.map((src) => (
                <SwipeToDeleteSourceRow
                  key={src.id}
                  isOpen={openSwipeId === src.id}
                  onOpenChange={(open) => {
                    setOpenSwipeId(open ? src.id : null);
                    if (!open) setConfirmingId(null);
                  }}
                  onRequestConfirm={() => handleRequestConfirm(src)}
                  onDelete={handleConfirmDelete}
                  isConfirming={confirmingId === src.id}
                  disabled={
                    confirmingId !== null && confirmingId !== src.id
                  }
                  className=""
                >
                  <div
                    onClick={() => handleSourceClick(src)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#0a0a0a]/45">
                        {formatDate(src.created_at)}
                      </span>
                      <span
                        className={
                          src.source_type === "report"
                            ? "inline-block shrink-0 rounded-full bg-[#b8a4ed]/25 px-2.5 py-0.5 text-xs font-semibold text-[#6b5ba0]"
                            : "inline-block shrink-0 rounded-full bg-[#ffb084]/30 px-2.5 py-0.5 text-xs font-semibold text-[#b85c2a]"
                        }
                      >
                        {src.source_type === "report" ? "截图" : "Quiz"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-semibold">{src.title}</p>
                    <p className="mt-0.5 text-sm leading-5 text-[#0a0a0a]/55 break-words">
                      {src.result}
                    </p>
                  </div>
                </SwipeToDeleteSourceRow>
              ))}
            </div>
          )}

          {/* Feedback banner */}
          {feedback && (
            <div
              className={
                feedback.type === "success"
                  ? "mt-3 rounded-2xl bg-[#e8f5e9] px-4 py-2.5 text-sm font-medium text-[#2e7d32]"
                  : "mt-3 rounded-2xl bg-[#fce4e4] px-4 py-2.5 text-sm font-medium text-[#c0392b]"
              }
            >
              {feedback.message}
            </div>
          )}
        </div>
      </div>

      {/* ── Quiz Result Share Card ── */}
      {cardType === "quiz" && (
        <RotatingCardModal open={cardOpen} onClose={closeCard}>
          {cardLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}
          {!cardLoading && cardData && (
            <QuizResultShareCard
              quizTitle={(cardData as QuizDetailData).quiz_title}
              resultName={(cardData as QuizDetailData).final_result_name}
              resultSubtitle={(cardData as QuizDetailData).result_subtitle ?? ""}
              resultDescription={(cardData as QuizDetailData).result_description ?? ""}
              resultImageUrl={(cardData as QuizDetailData).result_image_url ?? undefined}
              traits={(cardData as QuizDetailData).result_traits}
              cardColor={(cardData as QuizDetailData).result_color || "#DAC9A6"}
            />
          )}
        </RotatingCardModal>
      )}

      {/* ── OCR Screenshot Card ── */}
      {cardType === "report" && (
        <RotatingCardModal open={cardOpen} onClose={closeCard}>
          {cardLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}
          {!cardLoading && cardData && (cardData as ReportDetailData).image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(cardData as ReportDetailData).image_url!}
              alt="OCR 截图"
              className="w-full select-none"
              style={{ objectFit: "contain", maxHeight: "80vh" }}
            />
          ) : null}
          {!cardLoading && cardData && !(cardData as ReportDetailData).image_url ? (
            <div className="flex items-center justify-center rounded-2xl bg-white/10 px-8 py-16 text-white/50 text-sm">
              未保存原始截图
            </div>
          ) : null}
        </RotatingCardModal>
      )}
    </div>
  );
}
