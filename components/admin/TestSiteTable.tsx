import Link from "next/link";
import type { AdminTestSiteRow } from "@/lib/admin-db";
import { StatusBadge } from "./StatusBadge";
import { FeaturedBadge } from "./FeaturedBadge";
import { DeleteConfirm } from "./DeleteConfirm";
import { revalidatePath } from "next/cache";
import { deleteTestSite } from "@/lib/admin-db";
import { redirect } from "next/navigation";

function DeleteButton({ id, name }: { id: string; name: string }) {
  async function handleDelete() {
    "use server";
    await deleteTestSite(id);
    revalidatePath("/admin/test-sites");
    redirect("/admin/test-sites");
  }

  return (
    <DeleteConfirm
      title="确认删除"
      message={`确定要删除「${name}」吗？此操作不可撤销。`}
      onConfirm={handleDelete}
    />
  );
}

export function TestSiteTable({ sites }: { sites: AdminTestSiteRow[] }) {
  if (sites.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-[24px] bg-[var(--surface-card)] p-8">
        <p className="text-sm text-[var(--muted)]">暂无测试数据</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] bg-[var(--surface-card)] shadow-[0_8px_30px_rgba(10,10,10,0.04)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--hairline)] text-left">
            <Th>Name</Th>
            <Th className="hidden sm:table-cell">Category</Th>
            <Th className="hidden md:table-cell">Status</Th>
            <Th className="hidden lg:table-cell">Featured</Th>
            <Th className="hidden sm:table-cell text-right">Time</Th>
            <Th className="hidden lg:table-cell">Email</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr
              key={site.id}
              className="border-b border-[var(--hairline)] last:border-0 hover:bg-white/40"
            >
              <Td>
                <div>
                  <p className="font-semibold">{site.name}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{site.slug}</p>
                </div>
              </Td>
              <Td className="hidden sm:table-cell">
                <span className="text-[var(--muted)]">
                  {site.category?.name ?? "—"}
                </span>
              </Td>
              <Td className="hidden md:table-cell">
                <StatusBadge status={site.status} />
              </Td>
              <Td className="hidden lg:table-cell">
                <FeaturedBadge featured={site.featured} />
              </Td>
              <Td className="hidden sm:table-cell text-right tabular-nums">
                {site.estimated_minutes ?? "—"} min
              </Td>
              <Td className="hidden lg:table-cell">
                {site.supports_email_report ? (
                  <span className="text-xs font-semibold text-[#a4d4c5]">Yes</span>
                ) : (
                  <span className="text-xs text-[var(--muted)]">—</span>
                )}
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/test-sites/${site.id}/edit`}
                    className="rounded-[12px] bg-[var(--surface-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[#b8a4ed]/30"
                  >
                    编辑
                  </Link>
                  <DeleteButton id={site.id} name={site.name} />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)] ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}
