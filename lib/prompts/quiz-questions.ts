/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz questions                             */
/* ------------------------------------------------------------------ */

export const QUIZ_QUESTIONS_SYSTEM = `You are a quiz question designer for a vector-space personality quiz. Output ONLY valid JSON — no markdown, no explanation.

HOW IT WORKS:
Each option has "factor_effects" — integer deltas (-3 to +3) shifting the user's position on personality dimensions. After answering, accumulated values form a user vector, matched to pre-defined result vectors by Euclidean distance.

QUESTION RULES:

1. RESULTS-DRIVEN: Every question MUST help distinguish between provided results. Study the results' names, traits, and descriptions. Design questions that probe DIFFERENCES — if a question doesn't separate at least 2 results, it's useless.

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

7. PINNED QUESTIONS: Never generate questions with similar scenario or theme to pinned questions.

OUTPUT:
{"questions":[{"text":"...","description":"","options":[{"label":"A","text":"...","factor_effects":{"factor_key":2,"another_factor":-1}}]}]}
- Labels: sequential uppercase A, B, C, D...
- All text in Chinese except factor keys (English snake_case).`;

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
  pinned_questions?: { text: string }[];
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
    pinned_questions,
  } = input;

  let pinnedSection = "";
  if (pinned_questions && pinned_questions.length > 0) {
    pinnedSection = `\n已固定的题目（禁止生成场景或主题相似的题目）：\n${pinned_questions
      .map((q) => `- "${q.text}"`)
      .join("\n")}\n`;
  }

  const styleLine =
    `风格参数：抽象度${a}/100 严肃度${s}/100 深度${d}/100 文艺度${p}/100` +
    ` | ${a >= 70 ? "偏抽象/隐喻" : a <= 30 ? "偏真实/日常" : "平衡"} ` +
    `${s >= 70 ? "偏严肃/正式" : s <= 30 ? "偏搞怪/轻松" : "平衡"} ` +
    `${d >= 70 ? "偏深度/价值观" : d <= 30 ? "偏表面/偏好" : "平衡"} ` +
    `${p >= 70 ? "偏文艺/画面感" : p <= 30 ? "偏直白/简洁" : "平衡"}`;

  return `标题：「${title}」${hook ? ` 副标题：「${hook}」` : ""}
类型：${quiz_type} | 受众：${audienceStr} | 语气：${toneStr}
${styleLine}

结果人格（题目必须能区分这些结果）：
${resultsText}

因子维度：
${factorsText}

参考向量（高=该结果在此因子上的理想位置）：
${resultVectorsText}
${pinnedSection}

指令：
1. 生成恰好 ${question_count} 道题，每题 ${options_per_question} 个选项
2. 题目必须与「${title}」主题强相关，禁止使用与主题无关的通用人格测试套路题
3. 每道题必须能区分至少 2 个不同的结果人格 — 参考上述结果人格和其因子向量
4. 每道题覆盖不同的因子组合，所有 ${factorKeys.length} 个因子在整个题目集中都要有涉及
5. option 的 factor_effects 必须根据选项语义推断，不能随机赋值；值 -3 到 +3 整数，每选项影响 1-3 个因子
6. 题目要有场景感、容易选、适合分享${pinned_questions?.length ? "\n7. 不要生成与已固定题目场景或主题相似的新题目" : ""}`;
}
