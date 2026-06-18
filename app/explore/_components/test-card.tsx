import Link from "next/link";
import type { ExploreCard } from "@/lib/explore/types";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";

export function TestCard({ site: card }: { site: ExploreCard }) {
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
      className="group block p-5 shadow-[0_4px_20px_rgba(0,0,0,0.10)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.14)] active:scale-[0.98]"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* ---- 上部：标题 + 种类 ---- */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug">
          {card.title}
        </h3>
        <span className="shrink-0 pt-0.5 text-xs font-light" style={{ color: tintColor }}>
          {card.categoryLabel || "测评"}
        </span>
      </div>

      {/* ---- 虚线分割 ---- */}
      <hr className="my-3 border-t-2 border-dashed" style={{ borderColor }} />

      {/* ---- 中部：图片（仅 quiz 有结果图时） + 描述 ---- */}
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
          <p className="flex-1 line-clamp-4 text-sm font-normal leading-6" style={{ color: tintColor }}>
            {card.description}
          </p>
        </div>
      ) : (
        <p className="line-clamp-3 text-sm font-normal leading-6" style={{ color: tintColor }}>
          {card.description}
        </p>
      )}

      {/* ---- 虚线分割 ---- */}
      <hr className="my-3 border-t-2 border-dashed" style={{ borderColor }} />

      {/* ---- 下部：时间 + tags（左） / 来源（右） ---- */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-light" style={{ color: tintColor }}>
          {isOfficial && card.estimatedMinutes != null && (
            <>
              <span className="shrink-0">
                ⏱ {card.estimatedMinutes} min
              </span>
              {card.tags.length > 0 && (
                <span className="shrink-0">·</span>
              )}
            </>
          )}
          {card.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="shrink-0">
              #{tag}
            </span>
          ))}
          {!isOfficial && card.tags.length === 0 && (
            <span>{formatDate(card.created_at)}</span>
          )}
        </div>
        <span className="shrink-0 text-xs font-light" style={{ color: tintColor }}>
          {sourceLabel}
        </span>
      </div>
    </Link>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
