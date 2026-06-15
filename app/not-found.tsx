import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--canvas)] px-6 text-[var(--ink)]">
      <p className="text-6xl">404</p>
      <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em]">
        页面未找到
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        你访问的页面不存在或已被移除。
      </p>
      <Link
        href="/explore"
        className="mt-6 rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        返回首页
      </Link>
    </main>
  );
}
