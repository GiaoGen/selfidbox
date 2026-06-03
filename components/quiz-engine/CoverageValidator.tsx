import type { Question, Factor } from "@/lib/mock-quiz-engine";
import { validateQuestionCoverage } from "@/lib/quiz-vector";

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

export function CoverageValidator({
  questions,
  factors,
  bgColor,
  noCard,
}: {
  questions: Question[];
  factors: Factor[];
  bgColor?: string;
  noCard?: boolean;
}) {
  const coverage = validateQuestionCoverage(questions, factors);
  const light = bgColor && !isLight(bgColor);
  const titleClass = light ? "text-white" : "text-[var(--ink)]";
  const bodyClass = light ? "text-white/70" : "text-[var(--body)]";
  const mutedClass = light ? "text-white/50" : "text-[var(--muted)]";

  const body = (
    <>
      {/* Step header */}
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
          7
        </span>
        <h2 className={`text-xl font-semibold tracking-[-0.02em] ${titleClass}`}>
          题目覆盖检查
        </h2>
      </div>

      <p className={`mt-3 text-sm leading-6 ${bodyClass}`}>
        检查每个影响因子是否被至少一道题目的选项所测量。
      </p>

      <div className="mt-5 space-y-3">
        {coverage.map((item) => (
          <div
            key={item.factor.id}
            className={`flex items-center justify-between rounded-[20px] p-4 ${
              item.covered
                ? "bg-[#e8f5ec] border border-[#a4d4c5]/30"
                : "bg-[#fff5e8] border border-[#e8b94a]/30"
            }`}
          >
            <div className="flex items-center gap-3">
              {item.covered ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0 text-[#22c55e]">
                  <circle cx="11" cy="11" r="10" fill="currentColor" />
                  <path d="M7 11.5l2.5 2.5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="shrink-0 text-[#f59e0b]">
                  <circle cx="11" cy="11" r="10" fill="currentColor" />
                  <path d="M8 8l6 6M14 8l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
              <span className="text-sm font-semibold text-[var(--ink)]">{item.factor.name}</span>
            </div>
            <span className={`text-sm font-semibold ${item.covered ? "text-[#22c55e]" : "text-[#f59e0b]"}`}>
              {item.covered ? "已覆盖" : "未覆盖"}
            </span>
          </div>
        ))}
      </div>

      {coverage.some((c) => !c.covered) && (
        <div className="mt-4 rounded-[20px] bg-[#fff5e8] border border-[#e8b94a]/30 p-4">
          <p className="text-sm font-semibold text-[#8b6f1a]">
            {coverage.filter((c) => !c.covered).map((c) => `"${c.factor.name}"`).join("、")}
            目前没有被任何题目测量。
          </p>
        </div>
      )}
    </>
  );

  if (noCard) return body;

  return (
    <section
      className="rounded-[32px] p-6 sm:p-8 space-y-4"
      style={{ backgroundColor: bgColor ? `${bgColor}14` : "var(--surface-card)" }}
    >
      {body}
    </section>
  );
}
