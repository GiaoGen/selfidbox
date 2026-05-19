import { notFound, redirect } from "next/navigation";
import {
  getAdminTestSiteById,
  getAdminCategories,
  updateTestSite,
} from "@/lib/admin-db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TestSiteForm, type TestSiteFormData } from "@/components/admin/TestSiteForm";

export default async function EditTestSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [site, categories] = await Promise.all([
    getAdminTestSiteById(id),
    getAdminCategories(),
  ]);

  if (!site) {
    notFound();
  }

  async function handleUpdate(data: TestSiteFormData) {
    "use server";
    try {
      console.log("UPDATE TEST SITE PAYLOAD", { id, ...data });
      await updateTestSite(id, data);
      redirect("/admin/test-sites");
    } catch (error) {
      console.error("UPDATE TEST SITE ACTION ERROR", error);
      return { success: false as const, error };
    }
  }

  const initial: Partial<TestSiteFormData> = {
    slug: site.slug,
    name: site.name,
    category_id: site.category_id,
    description: site.description ?? "",
    long_description: site.long_description ?? "",
    url: site.url ?? "",
    logo_url: site.logo_url ?? "",
    cover_image_url: site.cover_image_url ?? "",
    tags: site.tags ?? [],
    language: site.language ?? "zh",
    country: site.country ?? "CN",
    estimated_minutes: site.estimated_minutes ?? 5,
    difficulty: site.difficulty ?? "标准",
    pricing: site.pricing ?? "free",
    supports_email_report: site.supports_email_report,
    email_report_note: site.email_report_note ?? "",
    status: site.status,
    featured: site.featured,
    sort_order: site.sort_order,
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="编辑测试"
        subtitle={site.name}
      />
      <TestSiteForm
        initial={initial}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        onSubmit={handleUpdate}
        submitLabel="更新测试"
      />
    </div>
  );
}
