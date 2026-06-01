import { notFound } from "next/navigation";
import { TestSiteDetail } from "@/components/TestSiteDetail";
import {
  getTestSiteBySlug,
  getTestSitesByCategory,
  mapTestSite,
} from "@/lib/test-sites-db";

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

  return (
    <TestSiteDetail
      site={site}
      relatedSites={relatedSites}
    />
  );
}
