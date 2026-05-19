import Link from "next/link";
import { getCategories, getTestSitesByCategory, mapCategory, mapTestSite } from "@/lib/test-sites-db";
import { TestCard } from "./test-card";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-[28px] bg-[var(--surface-card)] p-8">
      <p className="text-base text-[var(--muted)]">{message}</p>
    </div>
  );
}

export async function CategoryPage({ category }: { category: string }) {
  const [categoryRows, { category: currentCatRow, sites: siteRows }] =
    await Promise.all([
      getCategories(),
      getTestSitesByCategory(category),
    ]);

  const categories = categoryRows.map(mapCategory);
  const current = currentCatRow ? mapCategory(currentCatRow) : null;
  const tests = siteRows.map(mapTestSite);

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-full bg-[var(--surface-soft)] p-2">
          <Link
            href="/explore"
            className="rounded-full px-4 py-2 text-sm font-semibold"
          >
            SelfIDBox
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/profile"
              className="rounded-full px-4 py-2 text-sm font-semibold"
            >
              个人图谱
            </Link>
            <Link
              href="/create"
              className="rounded-full px-4 py-2 text-sm font-semibold"
            >
              Quiz Studio
            </Link>
            <Link
              href="/explore"
              className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
            >
              探索全部
            </Link>
          </div>
        </nav>

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

        {tests.length === 0 ? (
          <EmptyState message="该分类暂无测试数据" />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tests.map((site) => (
              <TestCard key={site.id} site={site} />
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
