import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

async function getRecentUsage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ai_usage_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[ai-usage] Fetch error:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function AdminAIUsagePage() {
  const rows = await getRecentUsage();

  return (
    <div className="flex min-h-screen gap-6 bg-[var(--canvas)] px-4 py-6 sm:px-6 lg:px-8">
      <AdminSidebar />
      <main className="flex-1 min-w-0">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">AI Usage</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            最近 AI 调用记录
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">暂无记录。</p>
        ) : (
          <div className="overflow-x-auto rounded-[24px] bg-[var(--surface-card)] shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--ink)]/8 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  <th className="px-5 py-3">时间</th>
                  <th className="px-5 py-3">功能</th>
                  <th className="px-5 py-3">模型</th>
                  <th className="px-5 py-3">Input</th>
                  <th className="px-5 py-3">Output</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">成本</th>
                  <th className="px-5 py-3">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ink)]/6">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/40">
                    <td className="px-5 py-3 text-xs text-[var(--muted)] whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <code className="rounded-full bg-[var(--ink)]/8 px-2 py-0.5 text-[11px] font-medium">
                        {row.feature}
                      </code>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--muted)]">
                      {row.model ?? "-"}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {row.prompt_tokens?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {row.completion_tokens?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-5 py-3 tabular-nums font-medium">
                      {row.total_tokens?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-xs text-[var(--muted)]">
                      {row.estimated_cost != null
                        ? `$${Number(row.estimated_cost).toFixed(6)}`
                        : "-"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          row.success
                            ? "rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                            : "rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                        }
                      >
                        {row.success ? "OK" : "FAIL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
