export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* Cover Flow area skeleton */}
        <div className="h-[250px] rounded-[28px] bg-[var(--surface-card)] animate-pulse" />

        {/* Divider */}
        <hr className="border-0 border-t border-[var(--ink)]/8" />

        {/* Summary text skeleton */}
        <div className="mx-auto h-8 w-64 rounded-full bg-[var(--surface-card)] animate-pulse" />

        {/* Radar chart skeletons */}
        <div className="flex flex-col gap-5">
          <div className="h-[260px] rounded-[36px] bg-[var(--surface-card)] animate-pulse" />
          <div className="h-[260px] rounded-[36px] bg-[var(--surface-card)] animate-pulse" />
        </div>
      </div>
    </main>
  );
}
