import { getAdminCategories, createTestSite } from "@/lib/admin-db";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TestSiteForm, type TestSiteFormData } from "@/components/admin/TestSiteForm";
import { redirect } from "next/navigation";

export default async function NewTestSitePage() {
  const categories = await getAdminCategories();

  async function handleCreate(data: TestSiteFormData) {
    "use server";
    const adminId = await requireAdmin();
    if (!adminId) return { success: false as const, error: "未授权" };
    try {
      await createTestSite(data);
      redirect("/admin/test-sites");
    } catch (error) {
      console.error("CREATE TEST SITE ACTION ERROR", error);
      return { success: false as const, error };
    }
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
