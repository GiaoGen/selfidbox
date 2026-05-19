const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-[#e8b94a] text-[#0a0a0a]" },
  published: { label: "Published", className: "bg-[#a4d4c5] text-[#0a0a0a]" },
  archived: { label: "Archived", className: "bg-[var(--surface-strong)] text-[var(--muted)]" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-[var(--surface-strong)] text-[var(--muted)]",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
