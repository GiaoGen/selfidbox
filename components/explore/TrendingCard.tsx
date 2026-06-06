import Link from "next/link";
import type { ExploreCard } from "@/lib/explore/types";

const palettes = [
  "bg-[linear-gradient(145deg,#7c3aed_0%,#a78bfa_50%,#f472b6_100%)]",
  "bg-[linear-gradient(145deg,#e11d48_0%,#f43f5e_40%,#fb923c_100%)]",
  "bg-[linear-gradient(145deg,#0891b2_0%,#06b6d4_40%,#818cf8_100%)]",
  "bg-[linear-gradient(145deg,#9333ea_0%,#a855f7_40%,#db2777_100%)]",
  "bg-[linear-gradient(145deg,#ea580c_0%,#dc2626_40%,#7c3aed_100%)]",
];

export function TrendingCard({ site: card, rank }: { site: ExploreCard; rank: number }) {
  const gradient = palettes[(rank - 1) % palettes.length];
  const badgeLabel = card.source_type === "official" ? "官方" : "社区";

  return (
    <Link
      href={card.href}
      className={`group relative flex w-[85vw] max-w-[420px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[32px] p-6 text-white shadow-[0_4px_30px_rgba(0,0,0,0.10),0_0_100px_rgba(130,80,220,0.06)] sm:w-[420px] ${gradient}`}
    >
      {/* Aurora inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.18)_0%,transparent_60%)]" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            #{rank} · 本周热门
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm ${
              card.source_type === "official"
                ? "bg-white/20"
                : "bg-[#a4d4c5]/30"
            }`}>
              {badgeLabel}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {card.categoryLabel || "测评"}
            </span>
          </div>
        </div>

        <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
          {card.title}
        </h2>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/80">
          {card.description}
        </p>

        {card.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {card.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-white/70">
          {card.estimatedMinutes != null && (
            <span>{card.estimatedMinutes} min</span>
          )}
          {card.popularity_score > 0 && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-white/85 backdrop-blur-sm">
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
