export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-6 text-[var(--ink)]">
      <div className="mx-auto max-w-5xl rounded-[32px] bg-[var(--surface-card)] p-6">
        <div className="h-5 w-28 rounded-full bg-black/10" />
        <div className="mt-8 h-12 w-3/4 rounded-2xl bg-black/10" />
        <div className="mt-4 h-24 rounded-3xl bg-black/10" />
      </div>
    </main>
  );
}
