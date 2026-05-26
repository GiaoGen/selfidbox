export default function QuizLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-[2px] w-32 overflow-hidden rounded-full bg-[var(--ink)]/8">
          <div className="h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-[var(--ink)]" />
        </div>
        <p className="text-sm text-[var(--muted)]">加载中...</p>
      </div>
    </main>
  );
}
