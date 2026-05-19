import type { Question, Factor } from "@/lib/mock-quiz-engine";

const EFFECT_COLORS: Record<string, string> = {
  sensitivity: "bg-[#ffb084]/20 text-[#8b5e3c]",
  expressiveness: "bg-[#ff4d8b]/15 text-[#b8315a]",
  imagination: "bg-[#b8a4ed]/25 text-[#5a3e9e]",
  drive: "bg-[#e8b94a]/20 text-[#8b6f1a]",
  orderliness: "bg-[#1a3a3a]/15 text-[#1a3a3a]",
};

function getFactorName(factorId: string, factors: Factor[]): string {
  return factors.find((f) => f.id === factorId)?.name ?? factorId;
}

function formatDelta(delta: number): string {
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function QuestionEffectsCard({
  question,
  factors,
  index,
}: {
  question: Question;
  factors: Factor[];
  index: number;
}) {
  return (
    <div className="rounded-[24px] bg-[var(--surface-card)] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
          {index + 1}
        </span>
        <p className="text-sm font-semibold text-[var(--muted)]">Question {index + 1}</p>
      </div>

      <p className="mt-3 text-lg font-semibold leading-7 text-[var(--ink)]">
        {question.text}
      </p>

      <div className="mt-4 space-y-3">
        {question.options.map((option) => (
          <div
            key={option.label}
            className="rounded-[16px] bg-[var(--surface-soft)] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-semibold text-white">
                {option.label}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--ink)]">{option.text}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(option.effects).map(([factorId, delta]) => {
                    if (delta === 0) return null;
                    const colorClass = EFFECT_COLORS[factorId] ?? "bg-[var(--surface-strong)]";
                    return (
                      <span
                        key={factorId}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
                      >
                        {getFactorName(factorId, factors)} {formatDelta(delta)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
