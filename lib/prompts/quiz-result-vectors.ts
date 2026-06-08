/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz result vectors                        */
/* ------------------------------------------------------------------ */

export const QUIZ_RESULT_VECTORS_SYSTEM = `You are a personality quiz designer. Your task is to assign factor values to result personality types.

Rules:
- Output ONLY valid JSON. No markdown, no code fences, no explanation.
- ALL numeric values MUST be INTEGER between 0 and 100. No float, no decimal.
- CORE trait values: assign HIGH 80-95.
- OPPOSITE trait values: assign LOW 10-30.
- NEUTRAL trait values: assign 40-60.
- Different results MUST be clearly distinguishable across factors.

Output format:
{
  "result_vectors": {
    "old_piano": {
      "sensitivity": 90,
      "independence": 25
    }
  }
}`;

export interface BuildQuizResultVectorsPromptInput {
  title: string;
  hook?: string;
  quiz_type?: string;
  audienceStr: string;
  toneStr: string;
  resultsText: string;
  factorsText: string;
  pinnedText?: string;
}

export function buildQuizResultVectorsPrompt(
  input: BuildQuizResultVectorsPromptInput,
): string {
  const { title, hook = "", quiz_type = "personality", audienceStr, toneStr, resultsText, factorsText, pinnedText = "" } = input;

  return `为测试的人格结果分配向量值。

测试标题：${title}
测试副标题：${hook}
测试类型：${quiz_type}
目标受众：${audienceStr}
语气风格：${toneStr}

待生成向量的结果人格：
${resultsText}

因子维度：
${factorsText}
${pinnedText}
请为以上每个结果在每个因子上分配 0-100 的值。记住：
- 核心匹配的特征高到 80-95
- 明显不符合的特征低到 10-30
- 中性特征 40-60
- 不同结果之间要有明显区分度`;
}
