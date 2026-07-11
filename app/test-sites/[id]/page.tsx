import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TestSiteDetail } from "@/components/TestSiteDetail";
import {
  getTestSiteBySlug,
  getTestSitesByCategory,
  mapTestSite,
} from "@/lib/test-sites-db";
import { testSiteToExploreCard } from "@/lib/explore/mapper";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const row = await getTestSiteBySlug(id);
  if (!row) return { title: "未找到" };
  const site = mapTestSite(row);
  return {
    title: `${site.name} — 测评站点`,
    description: site.description || `查看 ${site.name} 的详细信息`,
  };
}

export default async function TestSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getTestSiteBySlug(id);

  if (!row) {
    notFound();
  }

  const site = mapTestSite(row);

  const { sites: relatedRows } = await getTestSitesByCategory(site.category);
  const relatedSites = relatedRows
    .filter((r) => (r.slug || r.id) !== id)
    .slice(0, 3)
    .map(mapTestSite);

  // 👇 直接走 /explore 的 testSiteToExploreCard mapper，颜色与 /explore 卡片一致
  const siteCard = testSiteToExploreCard(site);
  const bgColor = siteCard.bg_color;
  const textColor = siteCard.text_color;

  return (
    <TestSiteDetail
      site={site}
      relatedSites={relatedSites}
      bgColor={bgColor}
      textColor={textColor}
    />
  );
}
