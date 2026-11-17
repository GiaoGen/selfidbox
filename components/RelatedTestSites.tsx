"use client";

import type { TestSite } from "@/lib/test-sites";
import { testSiteToExploreCard } from "@/lib/explore/mapper";
import type { ExploreCard } from "@/lib/explore/types";
import { MasonryTestList } from "@/components/explore/MasonryTestList";

export function RelatedTestSites({ sites }: { sites: TestSite[] }) {
  if (sites.length === 0) {
    return null;
  }

  // 与 /explore 共用同一 mapper → 颜色、样式完全同步
  const cards: ExploreCard[] = sites.map(testSiteToExploreCard);

  return (
    <section className="mx-auto w-full space-y-3">
      <div>
        <p className="text-sm font-semibold text-[var(--muted)]">
          Related tests
        </p>
        <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
          相关测试推荐
        </h2>
      </div>

      <MasonryTestList cards={cards} />
    </section>
  );
}
