import Link from "next/link";
import { categories, testSites } from "@/lib/test-sites";
import { TestCard } from "./_components/test-card";

const hotTests = testSites.slice(0, 6);

const accentBackground: Record<string, string> = {
  pink: "bg-[#ff4d8b] text-white",
  teal: "bg-[#1a3a3a] text-white",
  lavender: "bg-[#b8a4ed] text-[#0a0a0a]",
  peach: "bg-[#ffb084] text-[#0a0a0a]",
  ochre: "bg-[#e8b94a] text-[#0a0a0a]",
  mint: "bg-[#a4d4c5] text-[#0a0a0a]",
};

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-full bg-[var(--surface-soft)] p-2">
          <Link
            href="/explore"
            className="rounded-full px-4 py-2 text-sm font-semibold"
          >
            SelfIDBox
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/profile"
              className="rounded-full px-4 py-2 text-sm font-semibold"
            >
              个人图谱
            </Link>
            <Link
              href="/explore/fun"
              className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
            >
              今日热门
            </Link>
          </div>
        </nav>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[36px] bg-[var(--surface-card)] p-6 sm:p-8 lg:p-10">
            <p className="text-sm font-semibold text-[var(--muted)]">
              Personality tests, collected
            </p>
            <div className="mt-4 space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-7xl">
                找到适合你的测试，再把报告带回 SelfIDBox
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--body)] sm:text-lg">
                聚合人格、职业和娱乐测试。先用静态数据搭好发现路径，之后接入邮箱报告和 AI 解析。
              </p>
            </div>
            <label className="mt-8 flex min-h-14 items-center gap-3 rounded-[20px] border border-black/10 bg-white px-4 shadow-[0_14px_36px_rgba(10,10,10,0.06)]">
              <span className="text-lg" aria-hidden="true">
                Search
              </span>
              <input
                className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--muted)]"
                placeholder="搜索 MBTI、动物人格、职业锚..."
                type="search"
              />
            </label>
          </section>

          <aside className="relative overflow-hidden rounded-[36px] bg-[#ffb084] p-6 text-[#0a0a0a] sm:p-8">
            <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-[#ff4d8b]" />
            <div className="absolute bottom-8 right-16 h-20 w-20 rounded-[28px] bg-[#b8a4ed] rotate-6" />
            <div className="relative flex h-full min-h-[320px] flex-col justify-between">
              <p className="w-fit rounded-full bg-white/40 px-3 py-1 text-sm font-semibold">
                本周趋势
              </p>
              <div className="space-y-4">
                <h2 className="text-4xl font-semibold leading-none tracking-[-0.04em]">
                  轻测试更容易被分享，严肃报告更适合沉淀。
                </h2>
                <p className="text-sm leading-6 opacity-80">
                  这套页面先让用户找到测试，再为邮箱导入和 AI 总结留下入口。
                </p>
              </div>
            </div>
          </aside>
        </div>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                Categories
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
                分类入口
              </h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className={`min-h-44 rounded-[28px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.08)] ${accentBackground[category.accent]}`}
              >
                <div className="flex h-full flex-col justify-between gap-6">
                  <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                    {category.label}
                  </h3>
                  <p className="text-sm leading-6 opacity-85">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--muted)]">
              Popular tests
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
              热门测试卡片
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hotTests.map((site) => (
              <TestCard key={site.id} site={site} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
