/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz result vectors                        */
/* ------------------------------------------------------------------ */

export const QUIZ_RESULT_VECTORS_SYSTEM = `You assign factor vectors to quiz results. Output ONLY valid JSON — no markdown, no explanation.

SCORING PRIORITY (strict):
1. TRAITS — PRIMARY signal. Aligned trait → HIGH. Contradicting trait → LOW.
2. name — secondary, only when traits are ambiguous.
3. description — supplementary only. Never override traits.

VALUE BANDS (integer 0-100):
- 85-95: strongly aligned with a CORE trait (use sparingly — ≤30% of factors per result)
- 70-84: clearly aligned (use generously — this is the main "high" band)
- 35-65: moderate / no strong signal
- 15-29: clearly contradicting (use generously — this is the main "low" band)
- 5-14: strongly contradicting a core trait (use sparingly — ≤30% of factors)
DO NOT use 0-4 or 96-100 unless it is the single most defining or opposing trait for that result.

SPREAD REQUIREMENTS:
- Each result MUST have at least 2 factors in 70-95 AND at least 2 factors in 5-29. No flat profiles.
- Every factor MUST show ≥15 points difference across results — a factor where all results score within a narrow band is useless.
- At least 2 factors must show ≥40 points difference between the highest and lowest result.
- Most values should fall in 35-85. Extreme values (≥90 or ≤10) on ≤30% of factors per result.

INSTRUCTIONS:
- For each result × factor, assign a 0-100 integer.
- traits are the PRIMARY basis — matching trait → 70-85 (or 86-95 for strongest), contradicting → 15-29 (or 5-14 for strongest).
- No strong signal → 40-60.
- Each result must have clear peaks AND valleys.
- Different results must differ meaningfully on each factor.
- Pinned vectors (if listed in input) must NOT be modified — skip those result keys.

OUTPUT:
{"result_vectors":{"result_key":{"factor_key":78,"another_factor":22}}}`;

export interface BuildQuizResultVectorsPromptInput {
  title: string;
  hook?: string;
  quiz_type?: string;
  audienceStr: string;
  toneStr: string;
  results: { key: string; name: string; subtitle?: string; description: string; traits: string[] }[];
  factors: { key: string; name: string; description?: string }[];
  pinned_vectors?: { key: string; name: string; values: Record<string, number> }[];
}

export function buildQuizResultVectorsPrompt(
  input: BuildQuizResultVectorsPromptInput,
): string {
  const {
    title,
    hook = "",
    quiz_type = "personality",
    audienceStr,
    toneStr,
    results,
    factors,
    pinned_vectors,
  } = input;

  const resultsBlock = results
    .map((r) => {
      const sub = r.subtitle ? `「${r.subtitle}」` : "";
      return `- ${r.name}${sub}（${r.key}）\n  traits: ${(r.traits ?? []).join("、") || "无"}\n  desc: ${r.description}`;
    })
    .join("\n");

  const factorsBlock = factors
    .map((f) => `- ${f.key}（${f.name}）：${f.description || "无"}`)
    .join("\n");

  let pinnedBlock = "";
  if (pinned_vectors && pinned_vectors.length > 0) {
    pinnedBlock = `\n已固定的向量（不要修改，跳过以下 result key）：\n${pinned_vectors
      .map((p) => {
        const highs = Object.entries(p.values).filter(([, v]) => v >= 80).map(([k]) => k).join("、") || "无";
        const lows = Object.entries(p.values).filter(([, v]) => v <= 30).map(([k]) => k).join("、") || "无";
        return `- ${p.name}（${p.key}）：高=[${highs}] 低=[${lows}]`;
      })
      .join("\n")}`;
  }

  return `标题：「${title}」${hook ? ` 副标题：「${hook}」` : ""}
类型：${quiz_type} | 受众：${audienceStr} | 语气：${toneStr}

结果（traits 是分配向量的首要依据）：
${resultsBlock}

因子：
${factorsBlock}${pinnedBlock}`;
}
