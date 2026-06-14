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
import { ExploreClient } from "@/components/explore/ExploreClient";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type Range = "7d" | "30d" | "all";

function parseRange(raw: string | undefined): Range {
  if (raw === "7d" || raw === "30d") return raw;
  return "all";
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
    // featured first
    if (a.featured !== b.featured) return b.featured ? 1 : -1;
    // then popularity
    if (a.popularity_score !== b.popularity_score)
      return b.popularity_score - a.popularity_score;
    // then created_at
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function getTrending(cards: ExploreCard[]): ExploreCard[] {
  const recent7d = filterByRange(cards, "7d");
  return sortExploreCards(recent7d).slice(0, 5);
}

/* ------------------------------------------------------------------ */
/*  Page (server — data fetch only)                                    */
/* ------------------------------------------------------------------ */

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; range?: string; search?: string }>;
}) {
  const sp = await searchParams;

  const [categoryRows, siteRows, quizCards] = await Promise.all([
    getCategories(),
    getPublishedTestSites(),
    getExploreQuizCards(),
  ]);

  const categories: ExploreCategory[] = categoryRows.map(mapCategory);
  const siteCards: ExploreCard[] = siteRows
    .map(mapTestSite)
    .map(testSiteToExploreCard);

  // Merge test_sites + quizzes into unified list
  const allCards: ExploreCard[] = sortExploreCards([
    ...siteCards,
    ...quizCards,
  ]);

  console.log("[Explore] Data merge:", {
    officialCards: siteCards.length,
    quizCards: quizCards.length,
    allCards: allCards.length,
    quizCategoryIds: quizCards.map((c) => c.category_id),
    siteCategoryIds: siteCards.map((c) => c.category_id),
  });

  const trending = getTrending(allCards);

  const tabs = [
    { id: "hot", label: "热门" },
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
        />
      </section>
    </main>
  );
}
