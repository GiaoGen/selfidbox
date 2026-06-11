import Link from "next/link";
import { getCategories, getTestSitesByCategory, mapCategory, mapTestSite } from "@/lib/test-sites-db";
import { getExploreQuizCardsByCategory } from "@/lib/explore/fetch";
import { testSiteToExploreCard } from "@/lib/explore/mapper";
import type { ExploreCard } from "@/lib/explore/types";
import { TestCard } from "./test-card";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-[28px] bg-[var(--surface-card)] p-8">
      <p className="text-base text-[var(--muted)]">{message}</p>
    </div>
  );
}

function sortExploreCards(cards: ExploreCard[]): ExploreCard[] {
  return [...cards].sort((a, b) => {
    if (a.featured !== b.featured) return b.featured ? 1 : -1;
    if (a.popularity_score !== b.popularity_score)
      return b.popularity_score - a.popularity_score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function CategoryPage({ category }: { category: string }) {
  const [categoryRows, { category: currentCatRow, sites: siteRows }, quizCards] =
    await Promise.all([
      getCategories(),
      getTestSitesByCategory(category),
      getExploreQuizCardsByCategory(category),
    ]);

  const categories = categoryRows.map(mapCategory);
  const current = currentCatRow ? mapCategory(currentCatRow) : null;

  // Merge test_sites + quizzes
  const siteCards: ExploreCard[] = siteRows
    .map(mapTestSite)
    .map(testSiteToExploreCard);
  const allCards = sortExploreCards([...siteCards, ...quizCards]);

  console.log("[Explore] CategoryPage:", {
    category,
    currentCatId: current?.id,
    officialCards: siteCards.length,
    quizCards: quizCards.length,
    allCards: allCards.length,
    quizCategoryIds: quizCards.map((c) => c.category_id),
    siteCategoryIds: siteCards.map((c) => c.category_id),
  });

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[32px] bg-[var(--surface-card)] p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-semibold text-[var(--muted)]">
            Explore / {current?.label ?? category}
          </p>
          <div className="mt-4 max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold leading-none tracking-[-0.04em] sm:text-6xl">
              {current?.label ?? category}
            </h1>
            {current?.description && (
              <p className="text-base leading-7 text-[var(--body)] sm:text-lg">
                {current.description}
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  item.id === category
                    ? "bg-[var(--ink)] text-white"
                    : "bg-white text-[var(--ink)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {allCards.length === 0 ? (
          <EmptyState message="该分类暂无测试数据" />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allCards.map((card) => (
              <TestCard key={card.id} site={card} />
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
