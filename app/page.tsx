import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-[var(--background)]">
      <main className="flex flex-1 w-full max-w-lg flex-col items-center justify-center gap-8 px-8 text-center">
        <h1 className="text-4xl font-bold tracking-[-0.03em] text-[var(--ink)]">
          SelfIDBox
        </h1>
        <p className="text-lg leading-relaxed text-[var(--body)]">
          AI 驱动的人格表达平台。通过测验探索自我，构建专属人格图谱。
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/explore"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--ink)] px-8 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            探索测验
          </Link>
          <Link
            href="/create"
            className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--ink)]/12 bg-white px-8 text-[15px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--ink)]/25"
          >
            创建 Quiz
          </Link>
        </div>
      </main>
    </div>
  );
}
