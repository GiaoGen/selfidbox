import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminCategoryById, updateCategory } from "@/lib/admin-db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CategoryForm, type CategoryFormData } from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getAdminCategoryById(id);

  if (!category) {
    notFound();
  }

  async function handleUpdate(data: CategoryFormData) {
    "use server";
    const adminId = await requireAdmin();
    if (!adminId) redirect("/explore");
    await updateCategory(id, data);
    redirect("/admin/categories");
  }

  const initial: Partial<CategoryFormData> = {
    slug: category.slug,
    name: category.name,
    description: category.description ?? "",
    icon: category.icon ?? "",
    sort_order: category.sort_order,
    status: category.status,
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="编辑分类"
        subtitle={category.name}
      />
      <CategoryForm
        initial={initial}
        onSubmit={handleUpdate}
        submitLabel="更新分类"
      />
    </div>
  );
}
