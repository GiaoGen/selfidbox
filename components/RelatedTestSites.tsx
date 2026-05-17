import Link from "next/link";
import type { TestSite } from "@/lib/test-sites";

const accentClasses: Record<TestSite["accent"], string> = {
  pink: "bg-[#ff4d8b] text-white",
  teal: "bg-[#1a3a3a] text-white",
  lavender: "bg-[#b8a4ed] text-[#0a0a0a]",
  peach: "bg-[#ffb084] text-[#0a0a0a]",
  ochre: "bg-[#e8b94a] text-[#0a0a0a]",
  mint: "bg-[#a4d4c5] text-[#0a0a0a]",
};

export function RelatedTestSites({ sites }: { sites: TestSite[] }) {
  if (sites.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[var(--muted)]">
          Related tests
        </p>
        <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
          相关测试推荐
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {sites.map((site) => (
          <Link
            key={site.id}
            href={`/test-sites/${site.id}`}
            className={`flex min-h-44 flex-col justify-between rounded-[28px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.08)] ${accentClasses[site.accent]}`}
          >
            <div>
              <span className="rounded-full bg-white/28 px-3 py-1 text-xs font-semibold">
                {site.estimatedMinutes} min
              </span>
              <h3 className="mt-4 text-xl font-semibold leading-tight tracking-[-0.02em]">
                {site.name}
              </h3>
            </div>
            <p className="mt-5 line-clamp-2 text-sm leading-6 opacity-85">
              {site.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
