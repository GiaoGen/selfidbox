import Link from "next/link";
import type { ExploreCard } from "@/lib/explore/types";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";

export function TrendingCard({ site: card, rank }: { site: ExploreCard; rank: number }) {
  const sourceLabel = card.source_type === "official" ? "站外" : "SelfIDBox";
  const isOfficial = card.source_type === "official";

  const bgColor = card.bg_color || nipponColorForSlug(card.id);
  const textColor = card.text_color || textColorForNipponBg(bgColor);
  const isDark = textColor === "#FCFAF2";
  const tintColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(10,10,10,0.45)";
  const borderColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.15)";

  return (
    <Link
      href={card.href}
      className="group relative block h-full w-full pt-[30px] pb-[30px] px-6 shadow-[0_4px_20px_rgba(0,0,0,0.10)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.14)] active:scale-[0.98] flex flex-col justify-center"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* ---- 锯齿：顶部穿孔条 ---- */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-[6px]"
        style={{
          backgroundImage: "radial-gradient(circle at 4px 3px, var(--canvas) 2.5px, transparent 2.5px)",
          backgroundSize: "8px 6px",
          backgroundRepeat: "repeat-x",
        }}
      />

      {/* ---- 锯齿：底部穿孔条 ---- */}
      <div
        className="pointer-events-none absolute left-0 right-0 bottom-0 h-[6px]"
        style={{
          backgroundImage: "radial-gradient(circle at 4px 3px, var(--canvas) 2.5px, transparent 2.5px)",
          backgroundSize: "8px 6px",
          backgroundRepeat: "repeat-x",
        }}
      />

      {/* Subtle inner glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.12) 0%, transparent 60%)"
            : "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 60%)",
        }}
      />

      <div className="relative">
        {/* ---- 上部：rank 徽章 + 种类 ---- */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-base font-semibold leading-snug">
            #{rank} · 本周热门
          </span>
          <span className="shrink-0 pt-0.5 text-xs font-light" style={{ color: tintColor }}>
            {card.categoryLabel || "测评"}
          </span>
        </div>

        {/* ---- 虚线分割 ---- */}
        <hr className="my-3 border-t-2 border-dashed" style={{ borderColor }} />

        {/* ---- 中部：图片（有图时） + 标题 + 描述 ---- */}
        {card.image ? (
          <div className="flex gap-3">
            <div className="w-1/3 shrink-0 aspect-square overflow-hidden">
              <img
                src={card.image}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">
                {card.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm font-normal leading-6" style={{ color: tintColor }}>
                {card.description}
              </p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-3xl">
              {card.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm font-normal leading-6" style={{ color: tintColor }}>
              {card.description}
            </p>
          </>
        )}

        {/* ---- 虚线分割 ---- */}
        <hr className="my-3 border-t-2 border-dashed" style={{ borderColor }} />

        {/* ---- 下部：时间 + tags（左） / 来源（右） ---- */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-light" style={{ color: tintColor }}>
            {isOfficial && card.estimatedMinutes != null && (
              <>
                <span className="shrink-0">⏱ {card.estimatedMinutes} min</span>
                {card.tags.length > 0 && <span className="shrink-0">·</span>}
              </>
            )}
            {card.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="shrink-0">#{tag}</span>
            ))}
            {!isOfficial && card.tags.length === 0 && <span>&nbsp;</span>}
          </div>
          <span className="shrink-0 text-xs font-light" style={{ color: tintColor }}>
            {sourceLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
