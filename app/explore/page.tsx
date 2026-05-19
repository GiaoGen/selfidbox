import {
  getCategories,
  getPublishedTestSites,
  mapCategory,
  mapTestSite,
  type ExploreCategory,
} from "@/lib/test-sites-db";
import type { TestSite } from "@/lib/test-sites";
import { ExploreClient } from "@/components/explore/ExploreClient";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type Range = "7d" | "30d" | "all";

function parseRange(raw: string | undefined): Range {
  if (raw === "7d" || raw === "30d") return raw;
  return "all";
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

function getTrending(sites: TestSite[]): TestSite[] {
  const recent7d = filterByRange(sites, "7d");
  return sortByPopularity(recent7d)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 5);
}

/* ------------------------------------------------------------------ */
/*  Page (server — data fetch only)                                    */
/* ------------------------------------------------------------------ */

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; range?: string }>;
}) {
  const sp = await searchParams;

  const [categoryRows, siteRows] = await Promise.all([
    getCategories(),
    getPublishedTestSites(),
  ]);

  const categories: ExploreCategory[] = categoryRows.map(mapCategory);
  const allSites: TestSite[] = siteRows.map(mapTestSite);
  const trending = getTrending(allSites);

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
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <ExploreClient
          sites={allSites}
          trending={trending}
          tabs={tabs}
          rangePills={rangePills}
          initialTab={sp.tab || "hot"}
          initialRange={parseRange(sp.range)}
        />
      </section>
    </main>
  );
}
