import type { Result, ResultVector } from "@/lib/mock-quiz-engine";
import { validateResultDistances } from "@/lib/quiz-vector";

export function DistanceValidator({
  resultVectors,
  results,
}: {
  resultVectors: ResultVector[];
  results: Result[];
}) {
  const { pairs, threshold } = validateResultDistances(resultVectors, results);

  const closePairs = pairs.filter((p) => p.close);
  const distinctPairs = pairs.filter((p) => !p.close);

  return (
    <section className="rounded-[32px] bg-[var(--surface-card)] p-6 sm:p-8">
      <p className="text-sm font-semibold text-[var(--muted)]">Step 5</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
        Result Distance Validator
      </h2>
      <p className="mt-2 text-base leading-7 text-[var(--body)]">
        基于欧氏距离计算结果向量之间的相似程度。相似度 &gt; {threshold}% 表示两个人格位置较接近。
      </p>

      {closePairs.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-[var(--muted)]">
            距离较近的结果对（可能存在相似输出）
          </p>
          {closePairs.map((pair) => (
            <div
              key={`${pair.resultA.id}-${pair.resultB.id}`}
              className="rounded-[20px] bg-[#fff5e8] border border-[#e8b94a]/30 p-4"
            >
              <p className="text-sm leading-6 text-[var(--body)]">
                <span className="font-semibold text-[var(--ink)]">{pair.resultA.name}</span>
                {" 和 "}
                <span className="font-semibold text-[var(--ink)]">{pair.resultB.name}</span>
                {" 人格位置较接近（相似度 "}
                <span className="font-semibold">{pair.similarity}%</span>
                {"），可能会产生相似结果。"}
              </p>
            </div>
          ))}
        </div>
      )}

      {distinctPairs.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-[var(--muted)]">
            区分度良好的结果对
          </p>
          {distinctPairs.map((pair) => (
            <div
              key={`${pair.resultA.id}-${pair.resultB.id}`}
              className="rounded-[20px] bg-[#e8f5ec] border border-[#a4d4c5]/30 p-4"
            >
              <p className="text-sm leading-6 text-[var(--body)]">
                <span className="font-semibold text-[var(--ink)]">{pair.resultA.name}</span>
                {" 和 "}
                <span className="font-semibold text-[var(--ink)]">{pair.resultB.name}</span>
                {" 区分度良好（相似度 "}
                <span className="font-semibold">{pair.similarity}%</span>
                {"）。"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
