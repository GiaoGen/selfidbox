import Link from "next/link";
import { getAllPrompts, validatePromptContent } from "@/lib/ai/prompts";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const prompts = await getAllPrompts();

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Prompts</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manage AI prompt templates. DB prompts override code fallbacks when active.
        </p>
      </div>

      {prompts.length === 0 ? (
        <div className="rounded-[24px] bg-[var(--surface-card)] p-8 text-center shadow-sm">
          <p className="text-sm text-[var(--muted)]">
            No prompts found. Run the seed script or create prompts manually.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[24px] bg-[var(--surface-card)] shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--ink)]/8 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Version</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Valid</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ink)]/6">
              {prompts.map((row) => {
                const validation = validatePromptContent(row.prompt);
                const showWarning = row.is_active && !validation.valid;

                return (
                <tr key={row.key} className="hover:bg-white/40">
                  <td className="px-5 py-3">
                    <code className="rounded-full bg-[var(--ink)]/8 px-2 py-0.5 text-[11px] font-medium">
                      {row.key}
                    </code>
                  </td>
                  <td className="px-5 py-3 font-medium">{row.name}</td>
                  <td className="px-5 py-3 text-xs text-[var(--muted)] max-w-[240px] truncate">
                    {row.description ?? "-"}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-xs">
                    v{row.version}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        row.is_active
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"
                          : "rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500"
                      }
                    >
                      {row.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {showWarning ? (
                      <span
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                        title={validation.reason}
                      >
                        Invalid
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--muted)]">OK</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-[var(--muted)] whitespace-nowrap">
                    {new Date(row.updated_at).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/prompts/${row.key}/edit`}
                      className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
