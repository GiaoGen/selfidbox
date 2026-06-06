import Link from "next/link";
import type { ExploreCard } from "@/lib/explore/types";

const accentClasses: Record<string, string> = {
  pink: "bg-[#ff4d8b] text-white",
  teal: "bg-[#1a3a3a] text-white",
  lavender: "bg-[#b8a4ed] text-[#0a0a0a]",
  peach: "bg-[#ffb084] text-[#0a0a0a]",
  ochre: "bg-[#e8b94a] text-[#0a0a0a]",
  mint: "bg-[#a4d4c5] text-[#0a0a0a]",
};

export function TestCard({ site: card }: { site: ExploreCard }) {
  const badgeLabel = card.source_type === "official" ? "官方" : "社区";

  // If the card has an image, use it as background; otherwise use accent color
  const bgStyle = card.image
    ? ({
        backgroundImage: `url(${card.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } as React.CSSProperties)
    : undefined;

  const accentClass = accentClasses[card.accent] ?? accentClasses.lavender;

  return (
    <Link
      href={card.href}
      className={`group relative block overflow-hidden rounded-[24px] p-4 shadow-[0_8px_30px_rgba(10,10,10,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(10,10,10,0.10)] active:scale-[0.98] sm:p-5 ${bgStyle ? "text-white" : accentClass}`}
      style={bgStyle}
    >
      {/* Image overlay for readability */}
      {card.image && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      <div className="relative">
        {/* Top row: badge + category */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              card.source_type === "official"
                ? "bg-[#b8a4ed]/30 text-[#b8a4ed]"
                : "bg-[#a4d4c5]/30 text-[#a4d4c5]"
            }`}>
              {badgeLabel}
            </span>
            <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-semibold">
              {card.categoryLabel || "测评"}
            </span>
          </div>
          {card.estimatedMinutes != null && (
            <span className="text-xs font-semibold opacity-70">
              {card.estimatedMinutes} min
            </span>
          )}
        </div>

        {/* Title + description */}
        <h3 className="mt-3 text-lg font-semibold leading-tight tracking-[-0.01em] sm:text-xl">
          {card.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-6 opacity-80">
          {card.description}
        </p>

        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {card.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
