"use client";

import { motion } from "framer-motion";
import { RelatedTestSites } from "@/components/RelatedTestSites";
import { StampCard } from "@/components/StampCard";
import type { TestSite } from "@/lib/test-sites";

export function TestSiteDetail({
  site,
  relatedSites,
  bgColor,
  textColor,
}: {
  site: TestSite;
  relatedSites: TestSite[];
  /** 由 Server Page 传入，与 /explore 共用同一取色逻辑 */
  bgColor: string;
  textColor: string;
}) {
  const isDark = textColor === "#FCFAF2";
  const tintColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(10,10,10,0.45)";
  const borderColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.15)";

  const hasLongDesc = site.longDescription && site.longDescription !== site.description;

  function handleCTAClick() {
    window.open(site.url, "_blank", "noopener,noreferrer");
    fetch(`/api/test-sites/${site.id}/click`, { method: "POST" }).catch(() => {});
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* ---- 小票卡片：标题 + 描述 + tags ---- */}
        <motion.section
          className="p-5 shadow-[0_4px_20px_rgba(0,0,0,0.10)] sm:p-6"
          style={{ backgroundColor: bgColor, color: textColor }}
          initial={{ opacity: 0, scale: 0.90 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          {/* 上部：标题 + 种类 */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {site.name}
            </h1>
            <span className="shrink-0 pt-0.5 text-xs font-light" style={{ color: tintColor }}>
              {site.categoryLabel}
            </span>
          </div>

          <hr className="my-3 border-t-2 border-dashed" style={{ borderColor }} />

          {/* 中部：描述 */}
          <p className="text-sm font-normal leading-6" style={{ color: tintColor }}>
            {site.description}
          </p>

          <hr className="my-3 border-t-2 border-dashed" style={{ borderColor }} />

          {/* 下部：tags + 来源 */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 text-xs font-light" style={{ color: tintColor }}>
              {site.tags.map((tag) => (
                <span key={tag} className="shrink-0">#{tag}</span>
              ))}
              {site.tags.length > 0 && site.sourceName && (
                <span className="opacity-40">·</span>
              )}
              {site.sourceName && (
                <span className="shrink-0">{site.sourceName}</span>
              )}
            </div>
            <span className="shrink-0 text-xs font-light" style={{ color: tintColor }}>站外</span>
          </div>
        </motion.section>

        {/* ---- 详细描述（仅 longDescription 有值时） ---- */}
        {hasLongDesc && (
          <motion.section
            className="bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.10)] sm:p-6"
            initial={{ opacity: 0, scale: 0.90 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <h2 className="text-base font-semibold text-[var(--ink)]">详细描述</h2>
            <hr className="my-3 border-t-2 border-dashed border-[var(--hairline)]" />
            <p className="text-sm font-normal leading-6 text-[var(--body)]">
              {site.longDescription}
            </p>
          </motion.section>
        )}

        {/* ---- 邮票：时间 + 难度 + CTA ---- */}
        <motion.section
          className={`grid grid-cols-2 gap-3 ${site.coverImageUrl ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          animate="visible"
        >
          {site.coverImageUrl && (
            <motion.div
              variants={{ hidden: { opacity: 0, scale: 0.90 }, visible: { opacity: 1, scale: 1 } }}
              className="aspect-square w-full overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={site.coverImageUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </motion.div>
          )}
          <motion.div variants={{ hidden: { opacity: 0, scale: 0.90 }, visible: { opacity: 1, scale: 1 } }}>
            <StampCard colorKey={`duration-${site.id}`}>
              <div className="text-center">
                <p className="text-[10px] font-light uppercase tracking-[0.15em] opacity-50">时长</p>
                <p className="mt-1 text-xl font-semibold">{site.estimatedMinutes} min</p>
              </div>
            </StampCard>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.90 }, visible: { opacity: 1, scale: 1 } }}>
            <StampCard colorKey={`difficulty-${site.id}`}>
              <div className="text-center">
                <p className="text-[10px] font-light uppercase tracking-[0.15em] opacity-50">难度</p>
                <p className="mt-1 text-xl font-semibold">{site.difficulty}</p>
              </div>
            </StampCard>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, scale: 0.90 }, visible: { opacity: 1, scale: 1 } }}>
            <StampCard colorKey={`cta-${site.id}`} onClick={handleCTAClick}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </StampCard>
          </motion.div>
        </motion.section>

        <RelatedTestSites sites={relatedSites} />
      </div>
    </main>
  );
}
