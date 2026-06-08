import Link from "next/link";
import { ExploreTopNavbar } from "@/components/layout/ExploreTopNavbar";
import { RelatedTestSites } from "@/components/RelatedTestSites";
import { ExternalTestButton } from "@/components/test-sites/ExternalTestButton";
import type { TestSite } from "@/lib/test-sites";

const accentClasses: Record<TestSite["accent"], string> = {
  pink: "bg-[#ff4d8b] text-white",
  teal: "bg-[#1a3a3a] text-white",
  lavender: "bg-[#b8a4ed] text-[#0a0a0a]",
  peach: "bg-[#ffb084] text-[#0a0a0a]",
  ochre: "bg-[#e8b94a] text-[#0a0a0a]",
  mint: "bg-[#a4d4c5] text-[#0a0a0a]",
};

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

export function TestSiteDetail({
  site,
  relatedSites,
}: {
  site: TestSite;
  relatedSites: TestSite[];
}) {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <ExploreTopNavbar />

        <section
          className={`overflow-hidden rounded-[36px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.08)] sm:p-8 ${accentClasses[site.accent]}`}
        >
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/28 px-3 py-1 text-sm font-semibold">
              {site.categoryLabel}
            </span>
            {site.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/28 px-3 py-1 text-sm font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-8 space-y-5">
            <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-7xl">
              {site.name}
            </h1>
            <p className="max-w-3xl text-base leading-7 opacity-85 sm:text-lg">
              {site.longDescription}
            </p>
          </div>

          <div className="mt-8">
            <ExternalTestButton
              testSiteId={site.id}
              url={site.url}
            />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <DetailPill label="预计完成时间" value={`${site.estimatedMinutes} 分钟`} />
          <DetailPill label="测试难度" value={site.difficulty} />
        </section>

        <section className="rounded-[32px] bg-[var(--surface-card)] p-5 sm:p-6">
          <p className="text-sm font-semibold text-[var(--muted)]">简介</p>
          <p className="mt-3 text-base leading-7 text-[var(--body)]">
            {site.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {site.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>
        </section>

        <RelatedTestSites sites={relatedSites} />
      </div>
    </main>
  );
}
