import { notFound } from "next/navigation";
import { TestSiteDetail } from "@/components/TestSiteDetail";
import {
  getRelatedTestSites,
  getTestSite,
  importEmail,
  testSites,
} from "@/lib/test-sites";

export const dynamicParams = false;

export function generateStaticParams() {
  return testSites.map((site) => ({ id: site.id }));
}

export default async function TestSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = getTestSite(id);

  if (!site) {
    notFound();
  }

  return (
    <TestSiteDetail
      site={site}
      relatedSites={getRelatedTestSites(site, 3)}
      importEmail={importEmail}
    />
  );
}
