interface Props {
  current: number;
  total: number;
}

export function QuizProgress({ current, total }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs font-medium tracking-wide text-[var(--muted)]">
          {current} / {total}
        </span>
        <span className="font-mono text-xs font-medium tracking-wide text-[var(--muted)]">
          {pct}%
        </span>
      </div>
      <div className="h-[2px] w-full overflow-hidden bg-[var(--ink)]/10">
        <div
          className="h-full bg-[var(--ink)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
