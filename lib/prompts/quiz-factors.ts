import { SELFID_FACTORS } from "@/lib/selfid-factors";

/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz factors                              */
/* ------------------------------------------------------------------ */

export const QUIZ_FACTORS_SYSTEM = `You are a personality quiz designer. Your task is to SELECT dimensional factors (axes) from a predefined catalog for a quiz.

Rules:
- Output ONLY valid JSON. No markdown, no code fences, no explanation.
- You MUST pick factors ONLY from the provided catalog below. DO NOT invent new keys.
- Each factor key you return MUST be exactly one of the keys in the catalog.
- The name and description MUST match the catalog entry for that key.
- Choose factors that best differentiate the given results — no two results should look identical across all factors.
- Factors should be diverse and cover different aspects of personality.
- All text in Chinese except "key" which must be English snake_case.

PINNED FACTORS: Some factors may already be fixed (pinned) by the user. You will receive a list of pinned factors. You MUST:
- NOT select any factor with the same key as a pinned factor.
- Ensure every selected factor measures a genuinely different dimension from all pinned factors.

Output format:
{
  "factors": [
    {
      "key": "sensitivity",
      "name": "敏感度",
      "description": "衡量用户对情绪、环境和细节变化的感知强度"
    }
  ]
}`;

export interface BuildQuizFactorsPromptInput {
  title: string;
  hook?: string;
  quiz_type?: string;
  audienceStr: string;
  toneStr: string;
  results: { key: string; name: string; description: string; traits: string[] }[];
  count: number;
  pinned_factors?: { key: string; name: string }[];
}

export function buildQuizFactorsPrompt(input: BuildQuizFactorsPromptInput): string {
  const { title, hook = "", quiz_type = "personality", audienceStr, toneStr, results, count, pinned_factors } = input;

  const resultsSummary = results
    .map((r) => `- ${r.name}（${r.key}）：${r.description} 特质：[${(r.traits ?? []).join("、")}]`)
    .join("\n");

  let pinnedSection = "";
  if (pinned_factors && pinned_factors.length > 0) {
    pinnedSection = `\n以下因子已经被用户固定，千万不要重复或生成语义重复的因子：\n${pinned_factors
      .map((p) => `- ${p.name}（key: ${p.key}）`)
      .join("\n")}\n`;
  }

  const catalog = SELFID_FACTORS.map(
    (sf) => `- ${sf.key}（${sf.name}）：${sf.description}`,
  ).join("\n");

  return `从以下因子库中选择适合这个测试的因子维度。

测试标题：${title}
测试副标题：${hook}
测试类型：${quiz_type}
目标受众：${audienceStr}
语气风格：${toneStr}
因子数量：${count} 个

已有的结果人格：
${resultsSummary}
${pinnedSection}

可用因子库（只能从中选择，绝对不能自己创造 key）：
${catalog}

请从以上因子库中选择 ${count} 个能够有效区分这些结果人格的因子维度。${pinned_factors?.length ? "不能选择已被固定的因子。" : ""}每个因子必须能够产生足够的区分度——不能让所有结果在同一因子上看起来一样。返回的 key 必须与因子库中完全一致。`;
}
