import type { Metadata } from "next";
import {
  getCategories,
  getPublishedTestSites,
  mapCategory,
  mapTestSite,
  type ExploreCategory,
} from "@/lib/test-sites-db";
import { getExploreQuizCards } from "@/lib/explore/fetch";
import { testSiteToExploreCard } from "@/lib/explore/mapper";
import type { ExploreCard } from "@/lib/explore/types";
import { sortExploreCards } from "@/lib/explore/sort";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { logger } from "@/lib/logger";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type Range = "7d" | "30d" | "all";

function parseRange(raw: string | undefined): Range {
  if (raw === "7d" || raw === "30d") return raw;
  return "30d"; // default: one month
}

function getTrending(cards: ExploreCard[]): ExploreCard[] {
  // Default to past 30 days so trending reflects recent activity
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = cards.filter((c) => {
    if (!c.created_at) return true;
    return new Date(c.created_at).getTime() >= cutoff;
  });
  const sorted = sortExploreCards(recent);
  // Reserve at least 2 community (internal quiz) slots
  const top3 = sorted.slice(0, 3);
  const top3Ids = new Set(top3.map((c) => c.id));
  const communityCards = sorted.filter((c) => c.source_type === "community");
  const extraCommunity = communityCards
    .filter((c) => !top3Ids.has(c.id))
    .slice(0, 2);
  return sortExploreCards([...top3, ...extraCommunity]).slice(0, 5);
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                            */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Explore — Discover Personality Quizzes",
  description:
    "Browse and discover AI-powered personality quizzes and test sites. Find your SelfID.",
};

/* ------------------------------------------------------------------ */
/*  Page (server — data fetch only)                                    */
/* ------------------------------------------------------------------ */

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; range?: string; search?: string; internal?: string; latest?: string }>;
}) {
  const sp = await searchParams;

  const [categoryRows, siteRows, quizCards] = await Promise.all([
    getCategories(),
    getPublishedTestSites(),
    getExploreQuizCards(),
  ]);

  const showInternalOnly = sp.internal === "1";
  const sortByLatest = sp.latest === "1";

  const categories: ExploreCategory[] = categoryRows.map(mapCategory);
  const siteCards: ExploreCard[] = siteRows
    .map(mapTestSite)
    .map(testSiteToExploreCard);

  // Merge test_sites + quizzes into unified list
  const allCards: ExploreCard[] = sortExploreCards([
    ...siteCards,
    ...quizCards,
  ]);

  logger.debug("[Explore] Data merge:", {
    officialCards: siteCards.length,
    quizCards: quizCards.length,
    allCards: allCards.length,
    quizCategoryIds: quizCards.map((c) => c.category_id),
    siteCategoryIds: siteCards.map((c) => c.category_id),
  });

  const trending = getTrending(allCards);

  const tabs = [
    { id: "hot", label: "热门" },
    { id: "random", label: "随机测评" },
    ...categories.map((c) => ({ id: c.id, label: c.label })),
  ];

  const rangePills: { id: Range; label: string }[] = [
    { id: "7d", label: "一周内" },
    { id: "30d", label: "一个月内" },
    { id: "all", label: "全部时间" },
  ];

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-2 pb-6 sm:px-6 lg:px-8">
        <ExploreClient
          sites={allCards}
          trending={trending}
          tabs={tabs}
          rangePills={rangePills}
          initialTab={sp.tab || "hot"}
          initialRange={parseRange(sp.range)}
          initialSearch={sp.search || ""}
          initialInternalOnly={showInternalOnly}
          initialSortByLatest={sortByLatest}
        />
      </section>
    </main>
  );
}
