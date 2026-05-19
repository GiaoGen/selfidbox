"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function TrendingCarousel({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = Array.isArray(children) ? children.length : 1;
  const timerRef = useRef<number | null>(null);

  const scrollTo = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const slide = el.children[index] as HTMLElement | undefined;
      slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    },
    [],
  );

  /* ---- auto-play ---- */
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % total;
        scrollTo(next);
        return next;
      });
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total, scrollTo]);

  /* ---- track scroll position for dots ---- */
  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const item = el.children[0] as HTMLElement | undefined;
    const slideWidth = item?.clientWidth ?? 1;
    const gap = 16;
    const idx = Math.round(scrollLeft / (slideWidth + gap));
    setActiveIndex(Math.min(Math.max(0, idx), total - 1));
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Trending This Week
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
            本周热门
          </h2>
        </div>
        {/* Arrows (desktop) */}
        <div className="hidden gap-1.5 sm:flex">
          <button
            type="button"
            onClick={() => {
              const next = Math.max(0, activeIndex - 1);
              setActiveIndex(next);
              scrollTo(next);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm shadow-[0_2px_10px_rgba(10,10,10,0.05)] transition hover:bg-[var(--surface-strong)] hover:shadow-[0_4px_14px_rgba(10,10,10,0.08)]"
            aria-label="上一个"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => {
              const next = Math.min(total - 1, activeIndex + 1);
              setActiveIndex(next);
              scrollTo(next);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm shadow-[0_2px_10px_rgba(10,10,10,0.05)] transition hover:bg-[var(--surface-strong)] hover:shadow-[0_4px_14px_rgba(10,10,10,0.08)]"
            aria-label="下一个"
          >
            →
          </button>
        </div>
      </div>

      {/* Slides */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-1"
      >
        {children}
      </div>

      {/* Dots */}
      <div className="mt-5 flex justify-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setActiveIndex(i);
              scrollTo(i);
            }}
            className={`rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "h-1.5 w-5 bg-[#6366f1] shadow-[0_0_6px_rgba(99,102,241,0.4)]"
                : "h-1.5 w-1.5 bg-[var(--hairline)] hover:bg-[var(--muted)]"
            }`}
            aria-label={`第 ${i + 1} 个`}
          />
        ))}
      </div>
    </section>
  );
}
