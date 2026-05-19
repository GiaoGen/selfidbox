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
      className={`group block rounded-[24px] p-4 shadow-[0_8px_30px_rgba(10,10,10,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(10,10,10,0.10)] active:scale-[0.98] sm:p-5 ${accentClasses[site.accent]}`}
    >
      {/* Top row: category + time */}
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-semibold">
          {site.categoryLabel}
        </span>
        <span className="text-xs font-semibold opacity-70">
          {site.estimatedMinutes} min
        </span>
      </div>

      {/* Title + description */}
      <h3 className="mt-3 text-lg font-semibold leading-tight tracking-[-0.01em] sm:text-xl">
        {site.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-6 opacity-80">
        {site.description}
      </p>

      {/* Tags */}
      {site.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {site.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
