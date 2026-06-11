/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz questions                             */
/* ------------------------------------------------------------------ */

export const QUIZ_QUESTIONS_SYSTEM = `You are a quiz question designer for a vector-space personality quiz. Output ONLY valid JSON — no markdown, no explanation.

HOW IT WORKS:
Each option has "factor_effects" — integer deltas (-3 to +3) shifting the user's position on personality dimensions. After answering, accumulated values form a user vector, matched to pre-defined result vectors by Euclidean distance.

QUESTION RULES:

1. RESULTS-DRIVEN: Every question MUST help distinguish between the provided results. Study their names, traits, and descriptions. Design questions that probe DIFFERENCES — if a question doesn't separate at least 2 results, it's useless.

2. THEME-BINDING: Questions must feel native to THIS quiz, not a generic personality test. Use the quiz title as the creative anchor. Questions unrelated to the quiz theme are invalid.

3. ANTI-TEMPLATE — FORBIDDEN generic scenarios (unless directly required by the quiz theme):
- 周末/休息日做什么、聚会/派对上的行为、旅行/出游带什么、看风景想到什么
- 朋友难过怎么安慰、中彩票怎么花、理想生活什么样、面对困难怎么办
- Any scenario that could appear in ANY personality quiz regardless of theme.
Instead: generate questions that ONLY make sense for this specific quiz.

4. OPTION SEMANTICS — factor_effects MUST follow from option meaning, not random:
- "自己解决" → +independence, -attachment
- "寻求建议" → -independence, +attachment
- Each effect must have clear semantic justification.
- Each option affects 1-3 factors. Values: integers -3 to +3.

5. QUESTION DIVERSITY:
- No two questions probing the same situation or factor combination.
- Each question covers DIFFERENT factors.
- ALL factors must be covered across the question set.

6. STYLE (0-100, shape question text and option wording):
- abstractness: 0=concrete/everyday → 100=metaphorical/imaginative
- seriousness: 0=playful/humorous → 100=serious/formal
- depth: 0=surface/preferences → 100=values/inner-conflict
- poeticness: 0=direct/plain → 100=lyrical/imagery-rich

7. GENERATE exactly the requested question_count, each with the requested options_per_question.

8. EXISTING QUESTIONS (partial-fill mode):
You may receive existing questions with some fields already filled. Each has an "is_pinned" flag.
- PINNED (is_pinned=true): KEEP all non-empty fields as-is. ONLY fill in fields that are empty/null/missing. For options: if an option has text, keep it and only generate its factor_effects. If the question text is non-empty, NEVER change it.
- UNPINNED (is_pinned=false): you may regenerate freely.
- The final output MUST include ALL questions — both pinned (with empty fields filled) and newly generated ones — totaling exactly question_count.

OUTPUT:
{"questions":[{"text":"...","description":"","options":[{"label":"A","text":"...","factor_effects":{"factor_key":2,"another_factor":-1}}]}]}
- Labels: sequential uppercase A, B, C, D...
- All text in Chinese except factor keys (English snake_case).`;

export interface ExistingQuestion {
  text?: string;
  description?: string;
  options?: { label: string; text?: string; factor_effects?: Record<string, number> }[];
  is_pinned: boolean;
}

export interface BuildQuizQuestionsPromptInput {
  title: string;
  hook?: string;
  quiz_type?: string;
  audienceStr: string;
  toneStr: string;
  abstractness: number;
  seriousness: number;
  depth: number;
  poeticness: number;
  resultsText: string;
  factorsText: string;
  resultVectorsText: string;
  factorKeys: string[];
  question_count: number;
  options_per_question: number;
  existing_questions?: ExistingQuestion[];
}

export function buildQuizQuestionsPrompt(
  input: BuildQuizQuestionsPromptInput,
): string {
  const {
    title,
    hook = "",
    quiz_type = "personality",
    audienceStr,
    toneStr,
    abstractness: a,
    seriousness: s,
    depth: d,
    poeticness: p,
    resultsText,
    factorsText,
    resultVectorsText,
    factorKeys,
    question_count,
    options_per_question,
    existing_questions,
  } = input;

  let existingBlock = "";
  if (existing_questions && existing_questions.length > 0) {
    const lines = existing_questions.map((q) => {
      const pin = q.is_pinned ? "🔒PINNED" : "🔓unpinned";
      const hasText = q.text && q.text.trim();
      const optionCount = q.options?.length ?? 0;
      const filledOptions = q.options?.filter((o) => o.text && o.text.trim()).length ?? 0;
      const parts: string[] = [];
      if (!hasText) parts.push("text");
      if (optionCount === 0) parts.push("options");
      if (filledOptions < optionCount && optionCount > 0) parts.push("option factor_effects");
      const emptyNote = parts.length > 0 ? ` [需补全: ${parts.join(", ")}]` : "";
      return `- ${pin} "${q.text || "(无text)"}"${emptyNote}`;
    });
    existingBlock = `\n已有题目（保留 pinned 的非空字段，只补全缺失字段；不要生成与 pinned 场景或主题相似的题目）：\n${lines.join("\n")}`;
  }

  const styleLine =
    `风格：抽象度${a}/100(${a >= 70 ? "抽象" : a <= 30 ? "真实" : "平衡"}) ` +
    `严肃度${s}/100(${s >= 70 ? "严肃" : s <= 30 ? "搞怪" : "平衡"}) ` +
    `深度${d}/100(${d >= 70 ? "深度" : d <= 30 ? "轻松" : "平衡"}) ` +
    `文艺度${p}/100(${p >= 70 ? "文艺" : p <= 30 ? "直白" : "平衡"})`;

  return `标题：「${title}」${hook ? ` 副标题：「${hook}」` : ""}
类型：${quiz_type} | 受众：${audienceStr} | 语气：${toneStr}
${styleLine}
生成：${question_count} 题 × ${options_per_question} 选项 | 覆盖 ${factorKeys.length} 个因子：${factorKeys.join(", ")}

结果人格（题目必须能区分这些结果）：
${resultsText}

因子维度：
${factorsText}

参考向量（高=该结果在此因子上的理想位置）：
${resultVectorsText}${existingBlock}`;
}
