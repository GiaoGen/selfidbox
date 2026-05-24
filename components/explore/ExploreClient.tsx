"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import type { TestSite } from "@/lib/test-sites";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { TrendingCarousel } from "./TrendingCarousel";
import { TrendingCard } from "./TrendingCard";
import { TestCard } from "@/app/explore/_components/test-card";

/* ------------------------------------------------------------------ */
/*  Filters (pure functions, no server dependency)                     */
/* ------------------------------------------------------------------ */

type Range = "7d" | "30d" | "all";

function filterByTab(sites: TestSite[], tab: string): TestSite[] {
  if (tab === "hot" || !tab) return sites;
  return sites.filter((s) => s.category === tab);
}

function filterByRange(sites: TestSite[], range: Range): TestSite[] {
  if (range === "all") return sites;
  const days = range === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return sites.filter((s) => {
    if (!s.created_at) return true;
    return new Date(s.created_at).getTime() >= cutoff;
  });
}

function sortByPopularity(sites: TestSite[]): TestSite[] {
  return [...sites].sort(
    (a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0),
  );
}

function searchSites(sites: TestSite[], query: string): TestSite[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return sites.filter((s) => {
    if (s.name.toLowerCase().includes(q)) return true;
    if (s.description.toLowerCase().includes(q)) return true;
    if (s.tags.some((t) => t.toLowerCase().includes(q))) return true;
    if (s.categoryLabel.toLowerCase().includes(q)) return true;
    return false;
  });
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
  sites: TestSite[];
  trending: TestSite[];
  tabs: { id: string; label: string }[];
  rangePills: { id: Range; label: string }[];
  initialTab: string;
  initialRange: Range;
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
}: ExploreClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeRange, setActiveRange] = useState<Range>(initialRange);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---- filtered data (instant, no network) ---- */
  const filtered = useMemo(() => {
    let result = filterByTab(sites, activeTab);
    result = filterByRange(result, activeRange);
    return sortByPopularity(result);
  }, [sites, activeTab, activeRange]);

  const searchResults = useMemo(
    () => (searching ? searchSites(sites, query) : []),
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
    syncURL(activeTab, range);
  }

  function enterSearch() {
    setSearching(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function exitSearch() {
    setSearching(false);
    setQuery("");
  }

  return (
    <>
      {/* ================================================================ */}
      {/*  Nav bar + search dropdown                                        */}
      {/* ================================================================ */}
      <div className="relative">
        {searching ? (
          <nav className="relative z-10 flex items-center rounded-full bg-[var(--surface-soft)] p-2">
            <button
              type="button"
              onClick={exitSearch}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-white hover:text-[var(--ink)]"
              aria-label="返回"
            >
              ←
            </button>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") exitSearch(); }}
              placeholder="搜索测试名称、标签、分类..."
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-[var(--muted)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 rounded-full px-2 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              >
                清除
              </button>
            )}
          </nav>
        ) : (
          <TopNavbar
            rightSlot={
              <button
                type="button"
                onClick={enterSearch}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_2px_10px_rgba(10,10,10,0.05)] transition hover:bg-[var(--surface-strong)]"
                aria-label="搜索"
              >
                <Search size={16} />
                <span className="hidden sm:inline">搜索</span>
              </button>
            }
          />
        )}

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
                {searchResults.map((site) => (
                  <Link
                    key={site.id}
                    href={`/test-sites/${site.id}`}
                    onClick={exitSearch}
                    className="flex items-start gap-4 px-5 py-3 transition-colors hover:bg-[var(--surface-soft)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{site.name}</span>
                        {site.featured && <span className="shrink-0 text-[#e8b94a]"><StarIcon /></span>}
                      </div>
                      <span className="text-xs text-[var(--muted)]">{site.categoryLabel}</span>
                      {site.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {site.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="rounded-full bg-[var(--surface-strong)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-xs text-[var(--muted)]">
                      <ClockIcon />
                      {site.estimatedMinutes} min
                    </div>
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
          {trending.map((site, i) => (
            <TrendingCard key={site.id} site={site} rank={i + 1} />
          ))}
        </TrendingCarousel>
      )}

      {/* ================================================================ */}
      {/*  Tabs (buttons — no page reload)                                  */}
      {/* ================================================================ */}
      <div className="overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 min-w-max">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[var(--ink)] text-white"
                    : "bg-white text-[var(--ink)] hover:bg-[var(--surface-strong)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/*  Date range pills (buttons — no page reload)                      */}
      {/* ================================================================ */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[var(--muted)] shrink-0">时间</span>
        {rangePills.map((pill) => {
          const active = pill.id === activeRange;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => selectRange(pill.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "bg-[#b8a4ed]/30 text-[var(--ink)]"
                  : "bg-white text-[var(--muted)] hover:bg-[var(--surface-strong)]"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
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
          {filtered.map((site) => (
            <TestCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </>
  );
}
