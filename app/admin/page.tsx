import Link from "next/link";
import {
  getAdminStats,
  getAdminCategories,
  getRecentTestSites,
  getAdminQuizStats,
  type AdminTestSiteRow,
} from "@/lib/admin-db";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default async function AdminDashboard() {
  const [stats, categories, recent, quizStats] = await Promise.all([
    getAdminStats(),
    getAdminCategories(),
    getRecentTestSites(5),
    getAdminQuizStats(),
  ]);

  const categoryCount = categories.length;

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Dashboard"
        subtitle="SelfIDBox 聚合后台"
      />

      {/* ---- Stats ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="总测试数" value={stats.total} accent="lavender" />
        <StatCard label="已发布" value={stats.published} accent="mint" />
        <StatCard label="Draft" value={stats.draft} accent="ochre" />
        <StatCard label="分类数" value={categoryCount} accent="peach" />
      </div>

      {/* ---- Quiz Stats ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Quizzes" value={quizStats.total} accent="lavender" />
        <StatCard label="Published" value={quizStats.published} accent="mint" />
        <StatCard label="Sandbox" value={quizStats.sandbox} accent="peach" />
        <StatCard label="Submitted" value={quizStats.submitted} accent="ochre" />
      </div>

      {/* ---- Quick links ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink
          href="/admin/test-sites"
          label="管理测试网站"
          desc="查看、搜索、编辑和发布测试"
        />
        <QuickLink
          href="/admin/categories"
          label="管理分类"
          desc="创建和编辑测试分类"
        />
        <QuickLink
          href="/admin/quizzes"
          label="管理 Quizzes"
          desc="AI 人格测试后台管理"
        />
        <QuickLink
          href="/admin/test-sites/new"
          label="+ 新增测试"
          desc="添加新的测试网站"
        />
      </div>

      {/* ---- Recent ---- */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">最近新增</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">暂无数据</p>
        ) : (
          <div className="space-y-2">
            {recent.map((site) => (
              <RecentRow key={site.id} site={site} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  const accentBg: Record<string, string> = {
    lavender: "bg-[#b8a4ed]/25",
    mint: "bg-[#a4d4c5]/25",
    ochre: "bg-[#e8b94a]/25",
    peach: "bg-[#ffb084]/25",
  };

  return (
    <div
      className={`rounded-[24px] p-5 ${accentBg[accent] ?? "bg-[var(--surface-card)]"}`}
    >
      <p className="text-sm font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-4xl font-bold tracking-[-0.03em]">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  label,
  desc,
}: {
  href: string;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[24px] bg-[var(--surface-card)] p-5 shadow-[0_8px_30px_rgba(10,10,10,0.04)] transition-transform hover:-translate-y-0.5"
    >
      <h3 className="text-base font-semibold group-hover:underline">{label}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{desc}</p>
    </Link>
  );
}

function RecentRow({ site }: { site: AdminTestSiteRow }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] bg-[var(--surface-card)] px-5 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{site.name}</p>
        <p className="text-xs text-[var(--muted)]">
          {site.category?.name ?? "—"} · {site.slug}
        </p>
      </div>
      <StatusBadge status={site.status} />
    </div>
  );
}
