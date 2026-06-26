"use client";

import { motion } from "framer-motion";
import type { TestSite } from "@/lib/test-sites";
import { testSiteToExploreCard } from "@/lib/explore/mapper";
import type { ExploreCard } from "@/lib/explore/types";
import { TestCard } from "@/app/explore/_components/test-card";

export function RelatedTestSites({ sites }: { sites: TestSite[] }) {
  if (sites.length === 0) {
    return null;
  }

  // 与 /explore 共用同一 mapper → 颜色、样式完全同步
  const cards: ExploreCard[] = sites.map(testSiteToExploreCard);

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

      <motion.div
        className="grid gap-3 sm:grid-cols-3"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="visible"
      >
        {cards.map((card) => (
          <motion.div
            key={card.id}
            variants={{ hidden: { opacity: 0, scale: 0.90 }, visible: { opacity: 1, scale: 1 } }}
          >
            <TestCard site={card} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
