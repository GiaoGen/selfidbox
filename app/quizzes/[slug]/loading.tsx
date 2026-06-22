export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {/* Hero section */}
        <section className="rounded-[32px] bg-[var(--surface-card)] p-6 sm:p-8">
          <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--ink)]/5" />
          <div className="mt-6 h-10 w-3/4 animate-pulse rounded-2xl bg-[var(--ink)]/5" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded-full bg-[var(--ink)]/5" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-[var(--ink)]/5" />
          </div>
        </section>

        {/* Info grid */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-[20px] bg-[var(--surface-card)]"
            />
          ))}
        </section>

        {/* Related quizzes */}
        <section className="space-y-3">
          <div className="h-5 w-32 animate-pulse rounded-full bg-[var(--surface-card)]" />
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-[20px] bg-[var(--surface-card)]"
            />
          ))}
        </section>
      </div>
    </main>
  );
}
