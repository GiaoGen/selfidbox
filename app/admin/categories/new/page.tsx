import { createCategory } from "@/lib/admin-db";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CategoryForm, type CategoryFormData } from "@/components/admin/CategoryForm";
import { redirect } from "next/navigation";

export default function NewCategoryPage() {
  async function handleCreate(data: CategoryFormData) {
    "use server";
    const adminId = await requireAdmin();
    if (!adminId) redirect("/explore");
    await createCategory(data);
    redirect("/admin/categories");
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="新增分类"
        subtitle="添加一个新的测试分类"
      />
      <CategoryForm onSubmit={handleCreate} submitLabel="创建分类" />
    </div>
  );
}
