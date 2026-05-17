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

export function TestCard({ site }: { site: TestSite }) {
  return (
    <Link
      href={`/test-sites/${site.id}`}
      className={`group flex min-h-[280px] flex-col justify-between rounded-[28px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.08)] transition-transform duration-200 hover:-translate-y-1 sm:p-6 ${accentClasses[site.accent]}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-white/28 px-3 py-1 text-xs font-semibold">
            {site.categoryLabel}
          </span>
          <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-semibold">
            {site.estimatedMinutes} min
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold leading-tight tracking-[-0.02em]">
            {site.name}
          </h3>
          <p className="text-sm leading-6 opacity-85">{site.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {site.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/28 px-3 py-1 text-xs font-semibold"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-current/18 pt-4 text-sm font-semibold">
          <span>{site.supportsEmailReport ? "支持邮箱报告" : "网页结果"}</span>
          <span className="transition-transform group-hover:translate-x-1">
            查看详情
          </span>
        </div>
      </div>
    </Link>
  );
}
