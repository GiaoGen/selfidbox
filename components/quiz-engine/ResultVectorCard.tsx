import type { Result, Factor, ResultVector } from "@/lib/mock-quiz-engine";

const BAR_COLORS = [
  "bg-[#ffb084]",
  "bg-[#ff4d8b]",
  "bg-[#b8a4ed]",
  "bg-[#e8b94a]",
  "bg-[#1a3a3a]",
];

const CARD_ACCENTS = [
  "border-l-[#ffb084]",
  "border-l-[#ff4d8b]",
  "border-l-[#b8a4ed]",
  "border-l-[#e8b94a]",
  "border-l-[#1a3a3a]",
];

export function ResultVectorCard({
  result,
  vector,
  factors,
  index,
}: {
  result: Result;
  vector: ResultVector;
  factors: Factor[];
  index: number;
}) {
  const barColor = BAR_COLORS[index % BAR_COLORS.length];
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  return (
    <article className={`rounded-[24px] bg-[var(--surface-card)] p-5 border-l-[4px] ${accent}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold tracking-[-0.02em]">{result.name}</h3>
        <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
          Result Vector
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">{result.description}</p>

      <div className="mt-5 space-y-3">
        {factors.map((factor) => {
          const value = vector.values[factor.id] ?? 0;
          return (
            <div key={factor.id} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-sm font-semibold text-[var(--body)]">
                {factor.name}
              </span>
              <div className="flex-1 h-3 rounded-full bg-[var(--surface-strong)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm font-semibold text-[var(--ink)] tabular-nums">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
