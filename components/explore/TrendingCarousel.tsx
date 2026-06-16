"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PAUSE_AFTER_INTERACTION_MS = 8000;
const AUTO_PLAY_INTERVAL_MS = 5000;

export function TrendingCarousel({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cards = Array.isArray(children) ? children : [children];
  const total = cards.length;

  /* ---- Cloned slides for seamless infinite loop ---- */
  // Structure: [clone of last, 0, 1, ..., N-1, clone of first]
  // Real slides at indices 1..total, display index = slideIndex - 1
  const slides = total > 1 ? [cards[total - 1], ...cards, cards[0]] : cards;

  const [displayIndex, setDisplayIndex] = useState(0); // 0-based real card index
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);

  /* ---- Programmatic scroll (no CSS scroll-smooth, we control behavior) ---- */
  const scrollTo = useCallback(
    (slideIndex: number, smooth: boolean) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({
        left: slideIndex * el.clientWidth,
        behavior: smooth ? "smooth" : "instant",
      });
    },
    [],
  );

  /* ---- Auto-play ---- */
  const clearAutoPlayTimers = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (total <= 1) return;
    clearAutoPlayTimers();
    autoPlayTimerRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el || busyRef.current) return;

      const currentSlide = Math.round(el.scrollLeft / el.clientWidth);
      const next = currentSlide + 1;

      busyRef.current = true;
      scrollTo(next, true);
    }, AUTO_PLAY_INTERVAL_MS);
  }, [total, clearAutoPlayTimers, scrollTo]);

  const pauseAutoPlay = useCallback(() => {
    clearAutoPlayTimers();
  }, [clearAutoPlayTimers]);

  const scheduleResume = useCallback(() => {
    if (total <= 1) return;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(startAutoPlay, PAUSE_AFTER_INTERACTION_MS);
  }, [total, startAutoPlay]);

  /* ---- Lifecycle ---- */
  useEffect(() => {
    if (total <= 1) return;
    // Jump to real first slide (index 1) on mount
    scrollTo(1, false);
    startAutoPlay();
    return () => clearAutoPlayTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  /* ---- transitionend: detect when smooth scroll finishes, reset if on clone ---- */
  function handleTransitionEnd() {
    const el = scrollRef.current;
    if (!el) return;

    const slideIdx = Math.round(el.scrollLeft / el.clientWidth);

    if (slideIdx === 0) {
      // On "clone of last" → instant jump to real last (index total)
      scrollTo(total, false);
      setDisplayIndex(total - 1);
    } else if (slideIdx === slides.length - 1) {
      // On "clone of first" → instant jump to real first (index 1)
      scrollTo(1, false);
      setDisplayIndex(0);
    } else {
      // Real slide — update display index
      setDisplayIndex(slideIdx - 1);
    }

    busyRef.current = false;
  }

  /* ---- Scroll handler: detect user interaction ---- */
  function handleScroll() {
    if (busyRef.current) return;

    // User-initiated scroll — pause auto-play, schedule resume
    pauseAutoPlay();
    scheduleResume();
  }

  return (
    <section className="overflow-visible bg-transparent">
      <div className="overflow-hidden py-5">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onTransitionEnd={handleTransitionEnd}
          className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory bg-transparent"
        >
          {slides.map((child, i) => (
            <div
              key={i}
              className="w-full shrink-0 snap-center bg-transparent"
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`第 ${i + 1} 张`}
              onClick={() => {
                pauseAutoPlay();
                busyRef.current = true;
                scrollTo(i + 1, true);
                scheduleResume();
              }}
              className={`rounded-full transition-all duration-300 ${
                i === displayIndex
                  ? "h-[2px] w-4 bg-[var(--ink)]"
                  : "h-[2px] w-[2px] bg-[var(--ink)]/15 hover:bg-[var(--ink)]/35"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
