import Link from "next/link";
import { ImportEmailBox } from "@/components/ImportEmailBox";
import { RelatedTestSites } from "@/components/RelatedTestSites";
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
  importEmail,
}: {
  site: TestSite;
  relatedSites: TestSite[];
  importEmail: string;
}) {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
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
              href={`/explore/${site.category}`}
              className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
            >
              {site.categoryLabel}
            </Link>
          </div>
        </nav>

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

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 items-center justify-center rounded-[20px] bg-[var(--ink)] px-6 text-base font-semibold text-white"
            >
              去做这个测试
            </a>
            <a
              href={site.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 items-center justify-center rounded-[20px] bg-white/35 px-6 text-base font-semibold"
            >
              {site.sourceName}
            </a>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <DetailPill label="预计完成时间" value={`${site.estimatedMinutes} 分钟`} />
          <DetailPill label="邮箱报告" value={site.supportsEmailReport ? "支持" : "暂不支持"} />
          <DetailPill label="测试难度" value={site.difficulty} />
          <DetailPill label="第三方网站" value={site.sourceName} />
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

        <ImportEmailBox email={importEmail} />
        <RelatedTestSites sites={relatedSites} />
      </div>
    </main>
  );
}
