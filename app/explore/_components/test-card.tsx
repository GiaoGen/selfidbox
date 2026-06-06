import Link from "next/link";
import type { ExploreCard } from "@/lib/explore/types";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";

export function TestCard({ site: card }: { site: ExploreCard }) {
  const sourceLabel = card.source_type === "official" ? "站外" : "SelfIDBox";
  const isOfficial = card.source_type === "official";

  // Stable fallback — derive from id if fields missing (should never happen)
  const bgColor = card.bg_color || nipponColorForSlug(card.id);
  const textColor = card.text_color || textColorForNipponBg(bgColor);
  const isDark = textColor === "#FCFAF2";
  const tintColor = isDark ? "text-white/60" : "text-[#0a0a0a]/50";
  const chipBg = isDark ? "bg-white/15" : "bg-black/10";
  const chipText = isDark ? "text-white/90" : "text-[#0a0a0a]/80";

  return (
    <Link
      href={card.href}
      className="group relative block overflow-hidden rounded-[24px] p-4 shadow-[0_8px_30px_rgba(10,10,10,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(10,10,10,0.10)] active:scale-[0.98] sm:p-5"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >

      <div className="relative flex flex-col h-full">
        {/* Top row: estimated time (official) + category + tags ... source label */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
            {isOfficial && card.estimatedMinutes != null && (
              <span className={`text-xs font-semibold ${tintColor}`}>
                {card.estimatedMinutes} min
              </span>
            )}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chipBg} ${chipText}`}>
              {card.categoryLabel || "测评"}
            </span>
            {card.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chipBg} ${chipText}`}
              >
                #{tag}
              </span>
            ))}
          </div>
          <span className={`shrink-0 text-xs font-semibold ${tintColor}`}>
            {sourceLabel}
          </span>
        </div>

        {/* Title + description */}
        <h3 className="mt-3 text-lg font-semibold leading-tight tracking-[-0.01em] sm:text-xl">
          {card.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 opacity-80">
          {card.description}
        </p>
      </div>
    </Link>
  );
}
