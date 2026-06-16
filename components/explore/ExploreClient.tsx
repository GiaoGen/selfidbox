"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ExploreCard } from "@/lib/explore/types";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";
import { TrendingCarousel } from "./TrendingCarousel";
import { TrendingCard } from "./TrendingCard";
import { TestCard } from "@/app/explore/_components/test-card";

/* ------------------------------------------------------------------ */
/*  Filters (pure functions)                                           */
/* ------------------------------------------------------------------ */

type Range = "7d" | "30d" | "all";

function filterByTab(cards: ExploreCard[], tab: string): ExploreCard[] {
  if (tab === "hot" || !tab) return cards;
  const result = cards.filter((c) => String(c.category_id ?? "") === String(tab));
  console.log("[Explore] filterByTab:", {
    tab,
    inputCount: cards.length,
    outputCount: result.length,
    sampleCategoryIds: cards.slice(0, 3).map((c) => c.category_id),
  });
  return result;
}

function filterByRange(cards: ExploreCard[], range: Range): ExploreCard[] {
  if (range === "all") return cards;
  const days = range === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return cards.filter((c) => {
    if (!c.created_at) return true;
    return new Date(c.created_at).getTime() >= cutoff;
  });
}

function sortExploreCards(cards: ExploreCard[]): ExploreCard[] {
  return [...cards].sort((a, b) => {
    if (a.featured !== b.featured) return b.featured ? 1 : -1;
    if (a.popularity_score !== b.popularity_score)
      return b.popularity_score - a.popularity_score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function searchCards(cards: ExploreCard[], query: string): ExploreCard[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return cards.filter((c) => {
    if (c.title.toLowerCase().includes(q)) return true;
    if (c.description.toLowerCase().includes(q)) return true;
    if (c.tags.some((t) => t.toLowerCase().includes(q))) return true;
    if (c.categoryLabel.toLowerCase().includes(q)) return true;
    return false;
  });
}

/* ------------------------------------------------------------------ */
/*  Tab color helpers                                                   */
/* ------------------------------------------------------------------ */

const TAB_COLORS: Record<string, { bg: string; text: string }> = {
  hot: { bg: "#E83015", text: "#FCFAF2" },
};

function getTabColor(id: string): { bg: string; text: string } {
  if (TAB_COLORS[id]) return TAB_COLORS[id];
  const bg = nipponColorForSlug(id);
  return { bg, text: textColorForNipponBg(bg) };
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ExploreClientProps = {
  sites: ExploreCard[];
  trending: ExploreCard[];
  tabs: { id: string; label: string }[];
  rangePills: { id: Range; label: string }[];
  initialTab: string;
  initialRange: Range;
  initialSearch?: string;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ExploreClient({
  sites,
  trending,
  tabs,
  rangePills,
  initialTab,
  initialRange,
  initialSearch,
}: ExploreClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeRange, setActiveRange] = useState<Range>(initialRange);
  const [searching, setSearching] = useState(!!initialSearch);
  const [query, setQuery] = useState(initialSearch || "");
  const [timeOpen, setTimeOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filterRowRef = useRef<HTMLDivElement>(null);

  // When navigated to via navbar search, auto-open dropdown
  useEffect(() => {
    if (initialSearch) {
      setSearching(true);
      setQuery(initialSearch);
    }
  }, [initialSearch]);

  // Close time dropdown on outside click
  useEffect(() => {
    if (!timeOpen) return;
    function handleClick(e: MouseEvent) {
      if (filterRowRef.current && !filterRowRef.current.contains(e.target as Node)) {
        setTimeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [timeOpen]);

  /* ---- filtered data (instant, no network) ---- */
  const filtered = useMemo(() => {
    let result = filterByTab(sites, activeTab);
    result = filterByRange(result, activeRange);
    return sortExploreCards(result);
  }, [sites, activeTab, activeRange]);

  const searchResults = useMemo(
    () => (searching ? searchCards(sites, query) : []),
    [sites, searching, query],
  );

  const showDropdown = searching && query.trim().length > 0;

  /* ---- URL sync (no reload) ---- */
  const syncURL = useCallback(
    (tab: string, range: Range) => {
      const params = new URLSearchParams();
      if (tab !== "hot") params.set("tab", tab);
      if (range !== "all") params.set("range", range);
      const qs = params.toString();
      router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  function selectTab(tab: string) {
    setActiveTab(tab);
    syncURL(tab, activeRange);
  }

  function selectRange(range: Range) {
    setActiveRange(range);
    setTimeOpen(false);
    syncURL(activeTab, range);
  }

  function exitSearch() {
    setSearching(false);
    setQuery("");
  }

  const currentRangeLabel = rangePills.find((p) => p.id === activeRange)?.label ?? "全部时间";

  return (
    <>
      {/* ================================================================ */}
      {/*  Search dropdown                                                  */}
      {/* ================================================================ */}
      <div className="relative">
        {/* ---- Search dropdown ---- */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-[24px] border border-[var(--hairline)] bg-white shadow-[0_18px_50px_rgba(10,10,10,0.12)]">
            {searchResults.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-semibold text-[var(--ink)]">没有找到相关测评</p>
                <p className="mt-1 text-xs text-[var(--muted)]">试试其他关键词</p>
              </div>
            ) : (
              <div className="py-2">
                {searchResults.map((card) => (
                  <Link
                    key={card.id}
                    href={card.href}
                    onClick={exitSearch}
                    className="flex items-start gap-4 px-5 py-3 transition-colors hover:bg-[var(--surface-soft)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{card.title}</span>
                        {card.featured && <span className="shrink-0 text-[#e8b94a]"><StarIcon /></span>}
                      </div>
                      <span className="text-xs text-[var(--muted)]">{card.categoryLabel}</span>
                      {card.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {card.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="rounded-full bg-[var(--surface-strong)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {card.estimatedMinutes != null && (
                      <div className="flex shrink-0 items-center gap-1 text-xs text-[var(--muted)]">
                        <ClockIcon />
                        {card.estimatedMinutes} min
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/*  Trending Carousel                                                */}
      {/* ================================================================ */}
      {trending.length > 0 && (
        <TrendingCarousel>
          {trending.map((card, i) => (
            <TrendingCard key={card.id} site={card} rank={i + 1} />
          ))}
        </TrendingCarousel>
      )}

      {/* ================================================================ */}
      {/*  Combined filter row: time dropdown + tabs + bottom border         */}
      {/* ================================================================ */}
      <div ref={filterRowRef} className="relative">
        <div className="flex items-center gap-0 border-b border-[var(--hairline)] overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* ---- Time selector ---- */}
          <button
            type="button"
            onClick={() => setTimeOpen(!timeOpen)}
            className="shrink-0 px-3 py-2 text-[13px] font-semibold text-[var(--ink)] hover:text-[var(--muted)] transition-colors"
          >
            {currentRangeLabel}
            <span className="ml-1 text-[10px]">{timeOpen ? "▲" : "▼"}</span>
          </button>

          {/* ---- Divider ---- */}
          <span className="shrink-0 w-px h-4 bg-[var(--hairline)] mx-1" />

          {/* ---- Category tabs ---- */}
          <div className="flex items-center gap-1 min-w-max py-1.5">
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              const color = getTabColor(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className="shrink-0 px-3.5 py-1.5 text-[13px] font-semibold transition-colors"
                  style={
                    active
                      ? { backgroundColor: color.bg, color: color.text }
                      : { color: "var(--muted)" }
                  }
                  onMouseEnter={(e) => {
                    if (!active) (e.target as HTMLElement).style.color = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.target as HTMLElement).style.color = "var(--muted)";
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Time dropdown ---- */}
        {timeOpen && (
          <div className="absolute left-0 top-full z-20 border-b border-[var(--hairline)] bg-[var(--canvas)]">
            <div className="flex items-center gap-2 px-4 py-2">
              {rangePills.map((pill) => {
                const active = pill.id === activeRange;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => selectRange(pill.id)}
                    className="shrink-0 px-3 py-1 text-[13px] font-semibold transition-colors"
                    style={
                      active
                        ? { color: "var(--ink)" }
                        : { color: "var(--muted)" }
                    }
                    onMouseEnter={(e) => {
                      if (!active) (e.target as HTMLElement).style.color = "var(--ink)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.target as HTMLElement).style.color = "var(--muted)";
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/*  Results grid (instant filtering, no loading flash)               */}
      {/* ================================================================ */}
      {filtered.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[28px] bg-[var(--surface-card)] p-8 text-center">
          <p className="text-4xl">🔍</p>
          <p className="text-base font-semibold text-[var(--ink)]">这里还没有测评</p>
          <p className="text-sm text-[var(--muted)]">换个分类或时间范围看看。</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((card) => (
            <TestCard key={card.id} site={card} />
          ))}
        </div>
      )}
    </>
  );
}
