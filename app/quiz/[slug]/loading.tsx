import styles from "@/components/quiz-runtime/quiz-runtime.module.css";

export default function QuizLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4">
      <div className={`${styles.receipt} flex w-full max-w-[320px] flex-col items-center gap-4 px-6 py-10`}>
        <div className="h-[2px] w-32 overflow-hidden bg-[var(--ink)]/8">
          <div className="h-full w-1/3 animate-pulse bg-[var(--ink)]" />
        </div>
        <p className="text-sm text-[var(--muted)]">加载中...</p>
      </div>
    </main>
  );
}
