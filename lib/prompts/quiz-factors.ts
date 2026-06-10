import { SELFID_FACTORS } from "@/lib/selfid-factors";

/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz factors                              */
/* ------------------------------------------------------------------ */

const FACTOR_CATALOG = SELFID_FACTORS.map(
  (sf) => `- ${sf.key}（${sf.name}）：${sf.description}`,
).join("\n");

export const QUIZ_FACTORS_SYSTEM = `You are a quiz dimension designer. Output ONLY valid JSON — no markdown, no explanation.

WHAT FACTORS ARE:
Factors are DISCRIMINATIVE AXES — they SEPARATE quiz results, not describe them.
A good factor makes some results HIGH and others LOW, creating clear separation.
A bad factor is one where all results score similarly — useless for a quiz.

CRITICAL ANTI-PATTERN — do NOT turn result traits into factor names:
- Result has trait "温柔" → factor "温柔度" ❌ (just repeats the result)
- Instead: what dimension separates "温柔" from other results? → empathy, attachment, assertiveness ✓

RULES:
1. Read ALL provided results (name, subtitle, description, traits) before selecting.
2. Pick factors that SPREAD results apart — if a factor wouldn't vary across results, skip it.
3. EXACTLY the requested factor_count. No more, no less.
4. All keys from the catalog below only — never invent keys.
5. No duplicate keys.
6. key: English snake_case exactly as in catalog. name: Chinese exactly as in catalog.
7. description: explain HOW this factor discriminates these specific results. Do NOT copy the catalog definition. Pattern: "区分[某类结果]与[另一类结果]" — show what the factor separates.
8. Do NOT select factors already marked as pinned.

PINNED FACTORS: When pinned factors are listed in the input, skip them entirely — do not regenerate.

FACTOR CATALOG (only these 16 dimensions may be used):
${FACTOR_CATALOG}

OUTPUT:
{"factors":[{"key":"empathy","name":"共情力","description":"区分重视关系连接的结果与偏向独立自处的结果"}]}`;

export interface BuildQuizFactorsPromptInput {
  title: string;
  hook?: string;
  quiz_type?: string;
  audienceStr: string;
  toneStr: string;
  results: { key: string; name: string; subtitle?: string; description: string; traits: string[] }[];
  count: number;
  pinned_factors?: { key: string; name: string }[];
}

export function buildQuizFactorsPrompt(input: BuildQuizFactorsPromptInput): string {
  const { title, hook = "", quiz_type = "personality", audienceStr, toneStr, results, count, pinned_factors } = input;

  const resultsBlock = results
    .map((r) => {
      const sub = r.subtitle ? `「${r.subtitle}」` : "";
      return `- ${r.name}${sub}（${r.key}）：${r.description} 特质：[${r.traits.join("、")}]`;
    })
    .join("\n");

  let pinnedBlock = "";
  if (pinned_factors && pinned_factors.length > 0) {
    pinnedBlock = `\n已固定的因子（跳过，不重复选择）：\n${pinned_factors
      .map((p) => `- ${p.name}（key: ${p.key}）`)
      .join("\n")}`;
  }

  return `标题：「${title}」${hook ? ` 副标题：「${hook}」` : ""}
类型：${quiz_type} | 受众：${audienceStr} | 语气：${toneStr}
生成数量：${count}

结果（选择最能拉开差异的因子）：
${resultsBlock}${pinnedBlock}`;
}
