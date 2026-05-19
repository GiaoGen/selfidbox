import type { Factor } from "@/lib/mock-quiz-engine";

export function FactorList({ factors }: { factors: Factor[] }) {
  return (
    <section className="rounded-[32px] bg-[var(--surface-card)] p-6 sm:p-8">
      <p className="text-sm font-semibold text-[var(--muted)]">Factors</p>
      <p className="mt-2 text-base leading-7 text-[var(--body)]">
        这些影响因子构成了这个测试的人格空间。每个因子都是一个维度，题目选项会在这些维度上移动用户的向量位置。
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {factors.map((f) => (
          <span
            key={f.id}
            className="rounded-full bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            {f.name}
            <span className="ml-1.5 text-[var(--muted)] font-normal">{f.nameEn}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
