export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-2 pb-6 sm:px-6 lg:px-8">
        {/* ── Trending carousel area ── */}
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 animate-pulse rounded-[24px] bg-[var(--surface-card)]"
              style={{ width: "min(72vw, 280px)", height: 180 }}
            />
          ))}
        </div>

        {/* ── Category tabs ── */}
        <div className="flex gap-1.5">
          {[72, 48, 56, 64, 52, 44].map((w, i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-full bg-[var(--surface-card)]"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* ── Range pills ── */}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-8 animate-pulse rounded-full bg-[var(--surface-card)]" />
          {[48, 56, 52].map((w, i) => (
            <div
              key={i}
              className="h-7 animate-pulse rounded-full bg-[var(--surface-card)]"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* ── Card grid ── */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-[24px] bg-[var(--surface-card)]"
              style={{ height: 220 }}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
