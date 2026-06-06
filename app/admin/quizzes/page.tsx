import Link from "next/link";
import { getAdminQuizzes } from "@/lib/admin-db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteQuiz } from "@/lib/admin-db";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sandbox", label: "Sandbox" },
  { key: "submitted", label: "Submitted" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
];

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const quizzes = await getAdminQuizzes({
    search: sp.search,
    status: sp.status || undefined,
  });
  const hasFilters = !!(sp.search || sp.status);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Quizzes"
        subtitle={`${quizzes.length} 个 Quiz`}
        action={
          <Link
            href="/create"
            className="inline-flex rounded-[16px] bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"
          >
            + Quiz Studio
          </Link>
        }
      />

      {/* ── Status tabs ── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = (sp.status || "") === tab.key;
          const nextParams = new URLSearchParams();
          if (sp.search) nextParams.set("search", sp.search);
          if (tab.key) nextParams.set("status", tab.key);
          const href = `/admin/quizzes${nextParams.toString() ? `?${nextParams}` : ""}`;

          return (
            <Link
              key={tab.key}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-[var(--ink)] text-white"
                  : "bg-[var(--surface-card)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* ── Search ── */}
      <form className="flex gap-3">
        <input
          name="search"
          defaultValue={sp.search}
          placeholder="按标题搜索…"
          className="flex-1 rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#b8a4ed]"
        />
        {/* preserve status filter */}
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <button
          type="submit"
          className="rounded-[14px] bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          搜索
        </button>
        {hasFilters && (
          <Link
            href="/admin/quizzes"
            className="rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
          >
            清除
          </Link>
        )}
      </form>

      {/* ── Table ── */}
      {quizzes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[28px] bg-[var(--surface-card)] px-6 py-16 text-center shadow-[0_18px_50px_rgba(10,10,10,0.06)]">
          <p className="text-sm font-semibold text-[var(--muted)]">暂无 Quiz 数据</p>
          <Link
            href="/create"
            className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            去 Quiz Studio 创建
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[24px] bg-[var(--surface-card)] shadow-[0_18px_50px_rgba(10,10,10,0.06)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--hairline)]">
                <Th>Title</Th>
                <Th className="hidden sm:table-cell">Status</Th>
                <Th className="hidden md:table-cell">Attempts</Th>
                <Th className="hidden lg:table-cell">Category</Th>
                <Th className="hidden lg:table-cell">Featured</Th>
                <Th className="hidden xl:table-cell">Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-[var(--hairline)] last:border-0 hover:bg-white/40"
                >
                  <Td>
                    <div>
                      <p className="text-sm font-semibold truncate max-w-[200px]">{q.title}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5 sm:hidden">
                        <StatusBadge status={q.status} />
                      </p>
                    </div>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <StatusBadge status={q.status} />
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="text-sm tabular-nums">{q.attempt_count}</span>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <span className="text-sm text-[var(--muted)]">
                      {q.category?.name ?? "—"}
                    </span>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    {q.featured ? (
                      <span className="text-sm font-semibold text-[#b8a4ed]">★</span>
                    ) : (
                      <span className="text-sm text-[var(--muted)]">—</span>
                    )}
                  </Td>
                  <Td className="hidden xl:table-cell">
                    <span className="text-sm text-[var(--muted)]">
                      {new Date(q.created_at).toLocaleDateString("zh-CN")}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/quizzes/${q.id}/edit`}
                        className="text-sm font-semibold text-[#b8a4ed] hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteQuizButton id={q.id} title={q.title} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)] ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-4 ${className ?? ""}`}>{children}</td>;
}

/* ------------------------------------------------------------------ */
/*  Delete button                                                       */
/* ------------------------------------------------------------------ */

function DeleteQuizButton({ id, title }: { id: string; title: string }) {
  async function handleDelete() {
    "use server";
    await deleteQuiz(id);
    revalidatePath("/admin/quizzes");
    redirect("/admin/quizzes");
  }

  return (
    <DeleteConfirm
      title="确认删除"
      message={`确定要删除 Quiz「${title}」吗？该操作会同时删除所有题目、选项、结果和答题记录，不可恢复。`}
      onConfirm={handleDelete}
    />
  );
}
