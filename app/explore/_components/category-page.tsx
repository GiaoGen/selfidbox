import Link from "next/link";
import {
  categories,
  getTestsByCategory,
  type TestCategory,
} from "@/lib/test-sites";
import { TestCard } from "./test-card";

export function CategoryPage({ category }: { category: TestCategory }) {
  const current = categories.find((item) => item.id === category);
  const tests = getTestsByCategory(category);

  if (!current) {
    return null;
  }

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
              href="/explore"
              className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
            >
              探索全部
            </Link>
          </div>
        </nav>

        <div className="rounded-[32px] bg-[var(--surface-card)] p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-semibold text-[var(--muted)]">
            Explore / {current.label}
          </p>
          <div className="mt-4 max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold leading-none tracking-[-0.04em] sm:text-6xl">
              {current.label}
            </h1>
            <p className="text-base leading-7 text-[var(--body)] sm:text-lg">
              {current.description}
            </p>
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((site) => (
            <TestCard key={site.id} site={site} />
          ))}
        </section>
      </section>
    </main>
  );
}
