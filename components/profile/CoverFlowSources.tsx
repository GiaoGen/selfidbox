"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { RotatingCardModal } from "@/components/share/RotatingCardModal";
import { QuizResultShareCard } from "@/components/share/QuizResultShareCard";
import { useSourceCardOpen } from "@/components/profile/useSourceCardOpen";
import type { ProfileSourceEntry } from "@/lib/user-profile-db";
import type { QuizDetailData } from "@/lib/source-detail-db";

/* ================================================================== */
/*  CoverFlowSources                                                    */
/*  Stable scroll-snap carousel + center-depth effect + edge fades.      */
/*                                                                     */
/*  TUNING (lines 25–30):                                               */
/*    CARD_WIDTH     — card width (vw)                                  */
/*    CARD_MAX_W     — max width (px)                                   */
/*    CARD_MIN_W     — min width (px)                                   */
/*    SIDE_PAD_VW    — side padding so edges reach center               */
/*    PREVIEW_SCALE  — shrinks the full-size share card thumbnail       */
/*    PREVIEW_H      — fixed preview height (px)                        */
/*    GAP            — gap between cards (px)                           */
/* ================================================================== */

const CARD_WIDTH = "50vw";
const CARD_MAX_W = 180;
const CARD_MIN_W = 150;
const SIDE_PAD_VW = 28;
const PREVIEW_SCALE = 0.52;
const PREVIEW_H = 250;
const GAP = 16;

const INNER_W = Math.round(CARD_MAX_W / PREVIEW_SCALE);

/* ---- Depth curves (n = normalized distance from center, 0..3+) ---- */
function scaleAt(n: number)   { return Math.max(0.65, 1 - n * 0.11); }
function opacityAt(n: number) { return Math.max(0.4,  1 - n * 0.18); }
function liftAt(n: number)    { return Math.min(28, Math.round(n * 12)); }
function zAt(n: number)       { return Math.max(1, Math.round(10 - n * 3)); }

/* ================================================================== */

export function CoverFlowSources({
  initialSources,
}: {
  initialSources?: ProfileSourceEntry[];
}) {
  /* ---- Sources ---- */
  const ssrProvided = initialSources !== undefined;
  const [sources, setSources] = useState<ProfileSourceEntry[]>(initialSources ?? []);
  const [loading, setLoading] = useState(!ssrProvided);

  useEffect(() => {
    if (ssrProvided) return; // already have data from SSR
    let cancelled = false;
    async function fetchSources() {
      try {
        const res = await fetch("/api/profile/sources");
        const data = await res.json();
        if (!cancelled && data.ok) setSources(data.sources ?? []);
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchSources();
    return () => { cancelled = true; };
  }, [ssrProvided]);

  /* ---- Filter: quiz + image_url only ---- */
  const cards = sources.filter(
    (s) => s.source_type === "quiz" && s.image_url,
  );

  /* ---- Card open hook ---- */
  const { cardOpen, cardLoading, cardData, openCard, closeCard } =
    useSourceCardOpen();

  /* ---- Refs for scroll-driven depth ---- */
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);

  /* ---- Apply depth transforms (direct DOM, no React re-render) ---- */
  const updateStyles = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const cr = scroller.getBoundingClientRect();
    const vpCenter = cr.left + cr.width / 2;

    const first = cardRefs.current[0];
    const cardW = first ? first.getBoundingClientRect().width : 180;
    const step = cardW + GAP;

    for (let i = 0; i < cardRefs.current.length; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - vpCenter);
      const n = Math.min(dist / step, 3);

      el.style.transform = `scale(${scaleAt(n)}) translateY(${liftAt(n)}px)`;
      el.style.opacity = String(opacityAt(n));
      el.style.zIndex = String(zAt(n));
    }
  }, []);

  /* ---- Bind scroll / resize / init ---- */
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || cards.length === 0) return;

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateStyles);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });

    // initial calc once layout settles
    const init = setTimeout(updateStyles, 80);
    window.addEventListener("resize", updateStyles, { passive: true });

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateStyles);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(init);
    };
  }, [cards, updateStyles]);

  /* ---- Empty ---- */
  if (loading || cards.length === 0) return null;

  const sidePad = `${SIDE_PAD_VW}vw`;
  const showModal = cardOpen && cardData;

  return (
    <>
      {/* ── Carousel + fades ── */}
      <div
        className="relative z-0"
        style={{
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
        }}
      >
        {/* Top edge fade */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16"
          style={{
            background: "linear-gradient(to bottom, #fffaf0 0%, transparent 100%)",
          }}
        />
        {/* Bottom edge fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16"
          style={{
            background: "linear-gradient(to top, #fffaf0 0%, transparent 100%)",
          }}
        />

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="scrollbar-none overflow-x-auto scroll-smooth"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            className="flex items-start"
            style={{ paddingLeft: sidePad, paddingRight: sidePad, gap: GAP }}
          >
            {cards.map((src, i) => (
              <motion.div
                key={src.id}
                className="shrink-0"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.25,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              >
              <div
                ref={(el) => { cardRefs.current[i] = el; }}
                className="shrink-0 cursor-pointer"
                style={{
                  width: CARD_WIDTH,
                  maxWidth: CARD_MAX_W,
                  minWidth: CARD_MIN_W,
                  scrollSnapAlign: "center",
                  height: PREVIEW_H,
                  overflow: "hidden",
                  // initial depth — will be overwritten by updateStyles
                  transformOrigin: "center center",
                  willChange: "transform, opacity",
                }}
                onClick={() => openCard(src)}
              >
                <div
                  style={{
                    transform: `scale(${PREVIEW_SCALE})`,
                    transformOrigin: "top left",
                    width: INNER_W,
                  }}
                >
                  <QuizResultShareCard
                    quizTitle={src.title}
                    resultName={src.result}
                    resultSubtitle={src.subtitle ?? ""}
                    resultDescription={src.description ?? ""}
                    resultImageUrl={src.image_url ?? undefined}
                    traits={src.traits ?? []}
                    shareText={src.share_text ?? ""}
                    cardColor="#E8D5B7"
                  />
                </div>
              </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Card Modal (full-size, unchanged) ── */}
      {showModal && (
        <RotatingCardModal open={cardOpen} onClose={closeCard}>
          {cardLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          ) : (
            <QuizResultShareCard
              quizTitle={(cardData as QuizDetailData).quiz_title}
              resultName={(cardData as QuizDetailData).final_result_name}
              resultSubtitle={(cardData as QuizDetailData).result_subtitle ?? ""}
              resultDescription={(cardData as QuizDetailData).result_description ?? ""}
              resultImageUrl={(cardData as QuizDetailData).result_image_url ?? undefined}
              traits={(cardData as QuizDetailData).result_traits}
              shareText={
                (cardData as QuizDetailData).result_share_text ??
                "这是我的测试结果，你也来试试。"
              }
              cardColor="#E8D5B7"
            />
          )}
        </RotatingCardModal>
      )}
    </>
  );
}
