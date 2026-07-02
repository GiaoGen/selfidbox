export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--canvas)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-2 pb-6 sm:px-6 lg:px-8">
        {/* Greeting placeholder */}
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded-full bg-[var(--ink)]/5" />
          <div className="h-4 w-64 animate-pulse rounded-full bg-[var(--ink)]/5" />
        </div>

        {/* Trending carousel placeholder */}
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 w-[280px] shrink-0 animate-pulse rounded-[24px] bg-[var(--ink)]/5"
            />
          ))}
        </div>

        {/* Filter row placeholder */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 animate-pulse rounded-full bg-[var(--ink)]/5" />
          <div className="mx-1 h-4 w-px bg-[var(--hairline)]" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-14 animate-pulse rounded-full bg-[var(--ink)]/5"
            />
          ))}
        </div>

        {/* Card grid placeholder */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-[24px] bg-[var(--ink)]/5"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
