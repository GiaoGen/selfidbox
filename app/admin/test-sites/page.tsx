import Link from "next/link";
import { getAdminTestSites, getAdminCategories } from "@/lib/admin-db";
import { TestSiteTable } from "@/components/admin/TestSiteTable";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminTestSitesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const [sites, categories] = await Promise.all([
    getAdminTestSites({
      search: sp.search,
      categoryId: sp.category,
      status: sp.status,
    }),
    getAdminCategories(),
  ]);

  const hasFilters = !!(sp.search || sp.category || sp.status);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Test Sites"
        subtitle={`${sites.length} 个测试`}
        action={
          <Link
            href="/admin/test-sites/new"
            className="inline-flex rounded-[16px] bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"
          >
            + 新增测试
          </Link>
        }
      />

      {/* ---- Filters ---- */}
      <form className="flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={sp.search}
          placeholder="搜索名称..."
          className="min-w-[180px] rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#b8a4ed]"
        />
        <select
          name="category"
          defaultValue={sp.category}
          className="rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#b8a4ed]"
        >
          <option value="">全部分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={sp.status}
          className="rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#b8a4ed]"
        >
          <option value="">全部状态</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button
          type="submit"
          className="rounded-[14px] bg-[var(--surface-strong)] px-4 py-2.5 text-sm font-semibold"
        >
          筛选
        </button>
        {hasFilters && (
          <Link
            href="/admin/test-sites"
            className="rounded-[14px] px-4 py-2.5 text-sm text-[var(--muted)]"
          >
            清除
          </Link>
        )}
      </form>

      <TestSiteTable sites={sites} />
    </div>
  );
}
