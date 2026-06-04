import type { Result, ResultVector } from "@/lib/mock-quiz-engine";
import { validateResultDistances } from "@/lib/quiz-vector";

function getReadableTextColor(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
}

export function DistanceValidator({
  resultVectors,
  results,
  accentColors,
}: {
  resultVectors: ResultVector[];
  results: Result[];
  accentColors?: string[];
}) {
  const { pairs } = validateResultDistances(resultVectors, results);

  const closePairs = pairs.filter((p) => p.close);
  const distinctPairs = pairs.filter((p) => !p.close);

  if (pairs.length === 0) return null;

  // Solid Nippon color — one unified bg for all items in this step
  const itemBg = accentColors?.[5] ?? "#b8a4ed";
  const textColor = getReadableTextColor(itemBg);
  const isDark = textColor === "#1a1a1a";
  const mutedText = isDark ? "rgba(10,10,10,0.6)" : "rgba(255,255,255,0.7)";

  return (
    <>
      {closePairs.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--muted)]">
            距离较近的结果对（可能存在相似输出）
          </p>
          {closePairs.map((pair) => (
            <div
              key={`${pair.resultA.id}-${pair.resultB.id}`}
              className="rounded-[20px] p-4"
              style={{ backgroundColor: itemBg }}
            >
              <p className="text-sm leading-6" style={{ color: mutedText }}>
                <span className="font-semibold" style={{ color: textColor }}>{pair.resultA.name}</span>
                {" 和 "}
                <span className="font-semibold" style={{ color: textColor }}>{pair.resultB.name}</span>
                {" 人格位置较接近（相似度 "}
                <span className="font-semibold" style={{ color: textColor }}>{pair.similarity}%</span>
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
              className="rounded-[20px] p-4"
              style={{ backgroundColor: itemBg }}
            >
              <p className="text-sm leading-6" style={{ color: mutedText }}>
                <span className="font-semibold" style={{ color: textColor }}>{pair.resultA.name}</span>
                {" 和 "}
                <span className="font-semibold" style={{ color: textColor }}>{pair.resultB.name}</span>
                {" 区分度良好（相似度 "}
                <span className="font-semibold" style={{ color: textColor }}>{pair.similarity}%</span>
                {"）。"}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
