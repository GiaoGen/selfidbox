"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PAUSE_AFTER_INTERACTION_MS = 8000;
const AUTO_PLAY_INTERVAL_MS = 5000;

export function TrendingCarousel({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cards = Array.isArray(children) ? children : [children];
  const total = cards.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const isAutoScrollingRef = useRef(false);

  // Render [0, 1, ..., N-1, clone_of_0] for seamless forward-only infinite loop
  const slides = total > 1 ? [...cards, cards[0]] : cards;

  const scrollTo = useCallback((index: number, smooth: boolean) => {
    const el = scrollRef.current;
    if (!el) return;
    isAutoScrollingRef.current = true;
    el.scrollTo({ left: index * el.clientWidth, behavior: smooth ? "smooth" : "instant" });
  }, []);

  /* ---- auto-play helpers ---- */
  const clearAutoPlayTimers = useCallback(() => {
    if (autoPlayTimerRef.current) { clearInterval(autoPlayTimerRef.current); autoPlayTimerRef.current = null; }
    if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null; }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (total <= 1) return;
    clearAutoPlayTimers();
    autoPlayTimerRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el || busyRef.current) return;

      const currentIdx = Math.round(el.scrollLeft / el.clientWidth);
      const next = currentIdx + 1;

      if (next >= total) {
        busyRef.current = true;
        scrollTo(next, true);
        setTimeout(() => {
          scrollTo(0, false);
          setActiveIndex(0);
          busyRef.current = false;
        }, 500);
      } else {
        scrollTo(next, true);
        setActiveIndex(next);
      }
    }, AUTO_PLAY_INTERVAL_MS);
  }, [total, clearAutoPlayTimers, scrollTo]);

  const pauseAutoPlay = useCallback(() => {
    clearAutoPlayTimers();
  }, [clearAutoPlayTimers]);

  const scheduleResume = useCallback(() => {
    if (total <= 1) return;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      startAutoPlay();
    }, PAUSE_AFTER_INTERACTION_MS);
  }, [total, startAutoPlay]);

  /* ---- lifecycle ---- */
  useEffect(() => {
    if (total <= 1) return;
    startAutoPlay();
    return () => { clearAutoPlayTimers(); };
  }, [total, startAutoPlay, clearAutoPlayTimers]);

  /* ---- handleScroll — distinguish user scroll vs auto-play scroll ---- */
  function handleScroll() {
    if (busyRef.current) return;

    const el = scrollRef.current;
    if (!el) return;

    // Auto-play scroll → just update index, skip interaction logic
    if (isAutoScrollingRef.current) {
      isAutoScrollingRef.current = false;
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActiveIndex(idx >= total ? 0 : idx);
      return;
    }

    // User-initiated scroll
    const idx = Math.round(el.scrollLeft / el.clientWidth);

    if (idx >= total) {
      busyRef.current = true;
      scrollTo(0, false);
      setActiveIndex(0);
      requestAnimationFrame(() => { busyRef.current = false; });
    } else {
      setActiveIndex(idx);
    }

    pauseAutoPlay();
    scheduleResume();
  }

  return (
    /* outer: overflow-visible — let card shadows breathe, no clipping */
    <section className="overflow-visible">
      {/* viewport: overflow-hidden — clips slides only, not shadows */}
      <div className="overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth"
        >
          {slides.map((child, i) => (
            <div key={i} className="w-full shrink-0 snap-center flex justify-center px-2">
              {child}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
