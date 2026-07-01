"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ExploreCard } from "@/lib/explore/types";
import { sortExploreCards } from "@/lib/explore/sort";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";
import { TrendingCarousel } from "./TrendingCarousel";
import { TrendingCard } from "./TrendingCard";
import { TestCard } from "@/app/explore/_components/test-card";
import { Greeting } from "@/components/Greeting";

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

function filterByRange(cards: ExploreCard[], range: Range, now: number): ExploreCard[] {
  if (range === "all" || now === 0) return cards;
  const days = range === "7d" ? 7 : 30;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return cards.filter((c) => {
    if (!c.created_at) return true;
    return new Date(c.created_at).getTime() >= cutoff;
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

function filterBySource(
  cards: ExploreCard[],
  source: "community" | "official",
): ExploreCard[] {
  return cards.filter((c) => c.source_type === source);
}

/** Pick up to `count` items deterministically from a seed (avoids hydration mismatch from Math.random) */
function pickRandom(cards: ExploreCard[], count: number, seed: number): ExploreCard[] {
  const shuffled = [...cards].sort((a, b) => {
    const ha = simpleHash(a.id + String(seed));
    const hb = simpleHash(b.id + String(seed));
    return ha - hb;
  });
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/* ------------------------------------------------------------------ */
/*  Tab color helpers                                                   */
/* ------------------------------------------------------------------ */

const TAB_COLORS: Record<string, { bg: string; text: string }> = {
  hot: { bg: "#A96369", text: "#FCFAF2" },
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
  initialInternalOnly?: boolean;
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
  initialInternalOnly,
}: ExploreClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeRange, setActiveRange] = useState<Range>(initialRange);
  const [searching, setSearching] = useState(!!initialSearch);
  const [query, setQuery] = useState(initialSearch || "");
  const [timeOpen, setTimeOpen] = useState(false);
  const [showInternalOnly, setShowInternalOnly] = useState(initialInternalOnly ?? false);
  const [sortByLatest, setSortByLatest] = useState(false);
  const [randomSeed, setRandomSeed] = useState(0);
  const filterRowRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState<number>(0); // client-side timestamp for deterministic range filter

  // Capture client timestamp after hydration (avoids Date.now() mismatch)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNow(Date.now()); }, []);

  // When navigated to via navbar search, auto-open dropdown
  useEffect(() => {
    if (initialSearch) {
      // eslint-disable-next-line
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
    // Random mode — bypass tab/range/source, pick 5 internal quizzes
    if (activeTab === "random") {
      const pool = sites.filter((c) => c.source_type === "community");
      return pickRandom(pool, 5, randomSeed);
    }
    let result = filterByTab(sites, activeTab);
    if (showInternalOnly) result = filterBySource(result, "community");
    result = filterByRange(result, activeRange, now);
    // "最新" sorts by creation time (desc) for all tabs except "hot" and "random"
    if (sortByLatest && activeTab !== "hot") {
      return [...result].sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      );
    }
    return sortExploreCards(result);
  }, [sites, activeTab, activeRange, showInternalOnly, randomSeed, now, sortByLatest]);

  const searchResults = useMemo(() => {
    if (!searching) return [];
    let results = searchCards(sites, query);
    if (showInternalOnly) results = filterBySource(results, "community");
    return results;
  }, [sites, searching, query, showInternalOnly]);

  const showDropdown = searching && query.trim().length > 0;

  /* ---- URL sync (no reload) ---- */
  const syncURL = useCallback(
    (tab: string, range: Range, internalOnly: boolean) => {
      const params = new URLSearchParams();
      if (tab !== "hot") params.set("tab", tab);
      if (range !== "all") params.set("range", range);
      if (internalOnly) params.set("internal", "1");
      const qs = params.toString();
      router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  function selectTab(tab: string) {
    setActiveTab(tab);
    syncURL(tab, activeRange, showInternalOnly);
  }

  function selectRange(range: Range) {
    setActiveRange(range);
    setTimeOpen(false);
    syncURL(activeTab, range, showInternalOnly);
  }

  function toggleInternalOnly() {
    const next = !showInternalOnly;
    setShowInternalOnly(next);
    syncURL(activeTab, activeRange, next);
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
      {/*  Greeting                                                          */}
      {/* ================================================================ */}
      <Greeting className="-mb-7" />

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
            <div className="flex flex-col px-4 py-2 gap-1.5">
              {/* Row 1: time range pills */}
              <div className="flex items-center gap-2">
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

                {/* Divider */}
                <span className="w-px h-4 bg-[var(--hairline)] mx-1" />

                {/* Sort by latest */}
                <button
                  type="button"
                  onClick={() => setSortByLatest((v) => !v)}
                  className="shrink-0 px-3 py-1 text-[13px] font-semibold transition-colors"
                  style={
                    sortByLatest
                      ? { color: "var(--ink)" }
                      : { color: "var(--muted)" }
                  }
                  onMouseEnter={(e) => {
                    if (!sortByLatest) (e.target as HTMLElement).style.color = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    if (!sortByLatest) (e.target as HTMLElement).style.color = "var(--muted)";
                  }}
                >
                  最新
                </button>
              </div>

              {/* Row 2: 站内精选 toggle */}
              <div className="flex items-center gap-2 pt-1 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={toggleInternalOnly}
                  className="shrink-0 px-3 py-1 text-[13px] font-semibold transition-colors"
                  style={
                    showInternalOnly
                      ? { color: "var(--ink)" }
                      : { color: "var(--muted)" }
                  }
                  onMouseEnter={(e) => {
                    if (!showInternalOnly) (e.target as HTMLElement).style.color = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    if (!showInternalOnly) (e.target as HTMLElement).style.color = "var(--muted)";
                  }}
                >
                  站内精选
                </button>
              </div>
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
            <div key={card.id}>
              <TestCard site={card} />
            </div>
          ))}
        </div>
      )}

      {/* ---- Random mode: refresh button ---- */}
      {activeTab === "random" && filtered.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={() => setRandomSeed((s) => s + 1)}
            className="px-8 py-2.5 text-sm font-semibold
                       bg-[#f5f0e8] text-[var(--ink)]
                       shadow-[0_4px_20px_rgba(0,0,0,0.20)]
                       transition-shadow transition-transform duration-200
                       hover:shadow-[0_8px_30px_rgba(0,0,0,0.28)]
                       active:scale-[0.98]"
          >
            换一批
          </button>
        </div>
      )}
    </>
  );
}
