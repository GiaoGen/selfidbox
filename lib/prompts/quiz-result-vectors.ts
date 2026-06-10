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

  let pinnedSection = "";
  if (pinned_vectors && pinned_vectors.length > 0) {
    pinnedSection = `\n已固定的向量（禁止覆盖）：\n${pinned_vectors
      .map((p) => {
        const highs = Object.entries(p.values).filter(([, v]) => v >= 80).map(([k]) => k).join("、") || "无";
        const lows = Object.entries(p.values).filter(([, v]) => v <= 30).map(([k]) => k).join("、") || "无";
        return `- ${p.name}（${p.key}）：高=[${highs}] 低=[${lows}]（已固定）`;
      })
      .join("\n")}\n`;
  }

  return `标题：「${title}」${hook ? ` 副标题：「${hook}」` : ""}
类型：${quiz_type} | 受众：${audienceStr} | 语气：${toneStr}

结果（traits 是分配向量值的首要依据）：
${resultsBlock}

因子：
${factorsBlock}${pinnedSection}

指令：
1. 为每个 result 的每个 factor 分配 0-100 整数值
2. 大多数值应落在 35-85 区间，极端值（≥90 或 ≤10）每 result 不超过 30% 的 factor
3. 无明确信号 → 40-60；匹配 trait → 70-85；强烈匹配 → 86-95；矛盾 → 15-29；强烈矛盾 → 5-14
4. 每 result 至少 2 个 factor ≥70、至少 2 个 ≤29，有明显峰谷
5. 每个 factor 上最高值与最低值差距 ≥15；至少 2 个 factor 差距 ≥40
6. 不同 result 不能在所有 factor 上都接近 — 至少 2-3 个 factor 上有 ≥25 分的差异${pinned_vectors?.length ? "\n7. 不要修改已固定的向量值" : ""}`;
}
