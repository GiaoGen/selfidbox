import { getAdminCategories, createTestSite } from "@/lib/admin-db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TestSiteForm, type TestSiteFormData } from "@/components/admin/TestSiteForm";
import { redirect } from "next/navigation";

export default async function NewTestSitePage() {
  const categories = await getAdminCategories();

  async function handleCreate(data: TestSiteFormData) {
    "use server";
    await createTestSite(data);
    redirect("/admin/test-sites");
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="新增测试"
        subtitle="添加一个新的测试网站"
      />
      <TestSiteForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        onSubmit={handleCreate}
        submitLabel="创建测试"
      />
    </div>
  );
}
