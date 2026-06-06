import Link from "next/link";
import type { ExploreCard } from "@/lib/explore/types";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";

export function TrendingCard({ site: card, rank }: { site: ExploreCard; rank: number }) {
  const sourceLabel = card.source_type === "official" ? "站外" : "SelfIDBox";
  const hasImage = !!card.image;

  // Stable fallback — derive from id if bg_color missing (should never happen)
  const bgColor = card.bg_color || nipponColorForSlug(card.id);
  // For image cards, use the Nippon text color (not hardcoded white)
  const textColor = card.text_color || textColorForNipponBg(bgColor);
  const isDark = textColor === "#FCFAF2";

  return (
    <Link
      href={card.href}
      className="group relative flex w-[85vw] max-w-[420px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[32px] p-6 shadow-[0_4px_30px_rgba(0,0,0,0.10),0_0_100px_rgba(130,80,220,0.06)] sm:w-[420px]"
      style={{
        backgroundColor: hasImage ? "transparent" : bgColor,
        color: textColor,
      }}
    >
      {/* Blurred result image background — no overlay, covers entire card */}
      {hasImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${card.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(16px)",
            transform: "scale(1.12)",
          }}
        />
      )}

      {/* Subtle inner glow (no-image only) */}
      {!hasImage && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[32px]"
          style={{
            background: isDark
              ? "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)"
              : "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 60%)",
          }}
        />
      )}

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${isDark ? "bg-white/20" : "bg-black/10"}`}>
            #{rank} · 本周热门
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${isDark ? "text-white/60" : "text-[#0a0a0a]/50"}`}>
              {sourceLabel}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${isDark ? "bg-white/15" : "bg-black/10"}`}>
              {card.categoryLabel || "测评"}
            </span>
          </div>
        </div>

        <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
          {card.title}
        </h2>

        <p className="mt-3 line-clamp-2 text-sm leading-6 opacity-80">
          {card.description}
        </p>

        {card.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {card.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm ${isDark ? "bg-white/15" : "bg-black/10"}`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative mt-6 flex items-center justify-between">
        <div className={`flex items-center gap-3 text-xs ${isDark ? "text-white/70" : "text-[#0a0a0a]/60"}`}>
          {card.estimatedMinutes != null && (
            <span>{card.estimatedMinutes} min</span>
          )}
          {card.popularity_score > 0 && (
            <span className={`rounded-full px-2 py-0.5 backdrop-blur-sm ${isDark ? "bg-white/15 text-white/85" : "bg-black/10 text-[#0a0a0a]/70"}`}>
              🔥 {Math.round(card.popularity_score)}
            </span>
          )}
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#0a0a0a] shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all group-hover:scale-105 group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
          查看详情
        </span>
      </div>
    </Link>
  );
}
