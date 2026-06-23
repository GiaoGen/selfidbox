import type { UserVector, ResultVector, Result, Factor } from "@/lib/mock-quiz-engine";
import { rankResults } from "@/lib/quiz-vector";

const RANK_COLORS = [
  "bg-[#ffb084]",
  "bg-[#ff4d8b]",
  "bg-[#b8a4ed]",
  "bg-[#e8b94a]",
  "bg-[#1a3a3a]",
];

export function SimilarityRanking({
  userVector,
  resultVectors,
  results,
  factors,
}: {
  userVector: UserVector;
  resultVectors: ResultVector[];
  results: Result[];
  factors: Factor[];
}) {
  const ranked = rankResults(userVector, resultVectors, results);

  return (
    <section className="rounded-[32px] bg-[var(--surface-card)] p-6 sm:p-8">
      <p className="text-sm font-semibold text-[var(--muted)]">Step 8</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
        Mock User Result
      </h2>
      <p className="mt-2 text-base leading-7 text-[var(--body)]">
        模拟用户答题后，将 User Vector 与每个 Result Vector 进行相似度匹配。
      </p>

      <div className="mt-4 rounded-[20px] bg-[var(--surface-soft)] p-4">
        <p className="text-xs font-semibold text-[var(--muted)]">User Vector</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {factors.map((f) => (
            <span
              key={f.id}
              className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold"
            >
              {f.name}: {userVector[f.id]}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {ranked.map((item, i) => {
          const barColor = RANK_COLORS[i % RANK_COLORS.length];
          return (
            <div key={item.result.id} className="flex items-center gap-4">
              <span className="w-6 text-center text-sm font-semibold text-[var(--muted)]">
                {i + 1}
              </span>
              <span className="w-20 shrink-0 text-sm font-semibold text-[var(--ink)]">
                {item.result.name}
              </span>
              <div className="flex-1 h-5 rounded-full bg-[var(--surface-strong)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] ${barColor}`}
                  style={{ width: `${item.similarity}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm font-semibold text-[var(--ink)] tabular-nums">
                {item.similarity}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
