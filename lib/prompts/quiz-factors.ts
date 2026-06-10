import { SELFID_FACTORS } from "@/lib/selfid-factors";

/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz factors                              */
/* ------------------------------------------------------------------ */

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
3. EXACTLY factor_count factors. No more, no less.
4. All keys from the provided catalog only — never invent keys.
5. No duplicate keys.
6. key: English snake_case exactly as in catalog. name: Chinese exactly as in catalog.
7. description: explain HOW this factor discriminates these specific results. Do NOT copy the catalog definition. Pattern: "区分[某类结果]与[另一类结果]" — show what the factor separates.

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

  const resultsSummary = results
    .map((r) => {
      const sub = r.subtitle ? `「${r.subtitle}」` : "";
      return `- ${r.name}${sub}（${r.key}）：${r.description} 特质：[${(r.traits ?? []).join("、")}]`;
    })
    .join("\n");

  let pinnedSection = "";
  if (pinned_factors && pinned_factors.length > 0) {
    pinnedSection = `\n已固定的因子（禁止重复 key 或语义相似）：\n${pinned_factors
      .map((p) => `- ${p.name}（key: ${p.key}）`)
      .join("\n")}\n`;
  }

  const catalog = SELFID_FACTORS.map(
    (sf) => `- ${sf.key}（${sf.name}）：${sf.description}`,
  ).join("\n");

  return `标题：「${title}」${hook ? ` 副标题：「${hook}」` : ""}
类型：${quiz_type} | 受众：${audienceStr} | 语气：${toneStr}

已有的 Step 2 结果（根据这些结果选择最能区隔它们的因子）：
${resultsSummary}
${pinnedSection}

因子库（只能从中选择，不能自创 key）：
${catalog}

指令：
1. 从因子库中选择 ${count} 个最能拉开结果差异的维度
2. 选因子的标准不是和某个结果"像不像"，而是"能不能让不同结果在这个维度上拉开差距"
3. description 必须解释该因子如何区隔这些具体结果，不要照抄因子库定义${pinned_factors?.length ? "\n4. 不要选择已被固定的因子" : ""}`;
}
