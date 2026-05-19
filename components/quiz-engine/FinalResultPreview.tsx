import type { Result } from "@/lib/mock-quiz-engine";

export function FinalResultPreview({
  result,
  similarity,
  subtitle,
  interpretation,
  secondaryNote,
  secondaryResult,
}: {
  result: Result;
  similarity: number;
  subtitle: string;
  interpretation: string;
  secondaryNote: string;
  secondaryResult?: Result;
}) {
  return (
    <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_55%,#fffaf0_100%)] p-6 shadow-[0_18px_50px_rgba(10,10,10,0.08)] sm:p-8">
      <p className="text-sm font-semibold opacity-70">Final Result</p>

      <div className="mt-1 flex items-center gap-3">
        <h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          {result.name}人格
        </h2>
        <span className="rounded-full bg-white/35 px-3 py-1 text-sm font-semibold">
          匹配度 {similarity}%
        </span>
      </div>

      <p className="mt-3 text-lg leading-7 opacity-80">{subtitle}</p>

      <div className="mt-6 rounded-[24px] bg-white/35 p-5">
        <p className="text-sm font-semibold opacity-70">解释</p>
        <p className="mt-2 text-base leading-7 text-[var(--body)]">{interpretation}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {result.traits.map((trait) => (
          <span
            key={trait}
            className="rounded-full bg-white/35 px-3 py-1 text-sm font-semibold"
          >
            #{trait}
          </span>
        ))}
      </div>

      {secondaryResult && (
        <p className="mt-5 rounded-[20px] bg-white/25 p-4 text-sm leading-6">
          {secondaryNote}
        </p>
      )}
    </section>
  );
}
