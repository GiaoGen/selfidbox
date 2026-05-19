import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminCategories, deleteCategory } from "@/lib/admin-db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";

function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  async function handleDelete() {
    "use server";
    await deleteCategory(id);
    revalidatePath("/admin/categories");
    redirect("/admin/categories");
  }

  return (
    <DeleteConfirm
      title="确认删除"
      message={`确定要删除分类「${name}」吗？如果该分类下还有测试，删除可能会失败。`}
      onConfirm={handleDelete}
    />
  );
}

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Categories"
        subtitle={`${categories.length} 个分类`}
        action={
          <Link
            href="/admin/categories/new"
            className="inline-flex rounded-[16px] bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"
          >
            + 新增分类
          </Link>
        }
      />

      {categories.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-[24px] bg-[var(--surface-card)] p-8">
          <p className="text-sm text-[var(--muted)]">暂无分类数据</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[24px] bg-[var(--surface-card)] shadow-[0_8px_30px_rgba(10,10,10,0.04)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-left">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                  Icon
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                  Name
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)] hidden sm:table-cell">
                  Slug
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)] hidden md:table-cell">
                  Sort
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)] hidden sm:table-cell">
                  Status
                </th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-[var(--hairline)] last:border-0 hover:bg-white/40"
                >
                  <td className="px-5 py-4 text-lg">{cat.icon || "📁"}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{cat.name}</p>
                  </td>
                  <td className="px-5 py-4 text-[var(--muted)] hidden sm:table-cell">
                    {cat.slug}
                  </td>
                  <td className="px-5 py-4 tabular-nums hidden md:table-cell">
                    {cat.sort_order}
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <StatusBadge status={cat.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/categories/${cat.id}/edit`}
                        className="rounded-[12px] bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[#b8a4ed]/30"
                      >
                        编辑
                      </Link>
                      <DeleteCategoryButton id={cat.id} name={cat.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
