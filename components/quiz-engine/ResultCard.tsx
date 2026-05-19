import type { Result } from "@/lib/mock-quiz-engine";

const COLORS = [
  "bg-[#ffb084] text-[#0a0a0a]",
  "bg-[#ff4d8b] text-white",
  "bg-[#b8a4ed] text-[#0a0a0a]",
  "bg-[#e8b94a] text-[#0a0a0a]",
  "bg-[#1a3a3a] text-white",
];

export function ResultCard({ result, index }: { result: Result; index: number }) {
  const color = COLORS[index % COLORS.length];

  return (
    <article className={`rounded-[28px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.07)] ${color}`}>
      <p className="text-sm font-semibold opacity-70">Result {index + 1}</p>
      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{result.name}</h3>
      <p className="mt-3 text-sm leading-6 opacity-80">{result.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {result.traits.map((trait) => (
          <span
            key={trait}
            className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold"
          >
            {trait}
          </span>
        ))}
      </div>
    </article>
  );
}
