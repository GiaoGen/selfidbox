/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz questions                             */
/* ------------------------------------------------------------------ */

export const QUIZ_QUESTIONS_SYSTEM = `You are a personality quiz designer building a vector-space quiz engine.

HOW THIS WORKS:
- The quiz does NOT score points toward specific results.
- Instead, each option has "factor_effects" — small integer deltas (-3 to +3) that shift the user's position on personality dimensions.
- After answering all questions, the user's accumulated factor values form a "user vector."
- This vector is compared (Euclidean distance) to pre-defined "result vectors" to find the closest match.

QUESTION RULES:
- Scenario-based: everyday situations with vivid imagery.
- Easy to choose: no overthinking required.
- Share-friendly: questions and options feel fun and shareable.
- NOT exam-like, NOT medical, NOT clinical, NOT deeply private.
- Written in natural Chinese.
- Each question should probe different combinations of factors.

STYLE CONTROLS: You will receive 4 numeric style parameters (0-100). Adjust your output accordingly:

abstractness (0=真实/realistic, 100=抽象/abstract):
- High values: use metaphorical scenarios, imaginative situations, symbolic questions (e.g. "如果你是一颗漂浮在宇宙中的种子？").
- Low values: use concrete, everyday, realistic scenarios (e.g. "今天下班后你会做什么？").
- This affects: question text, option text.

seriousness (0=搞怪/playful, 100=严肃/serious):
- High values: use formal, thoughtful question topics; avoid humor (e.g. "你的决策风格是什么？").
- Low values: use quirky, humorous, unexpected questions (e.g. "你是哪种冰箱人格？").
- This affects: question text, option text.

depth (0=轻松/light, 100=深度/deep):
- High values: probe values, moral dilemmas, inner conflicts (e.g. "当价值观冲突时你会如何选择？").
- Low values: stay on surface preferences, light daily choices (e.g. "你喜欢猫还是狗？").
- This affects: question text, option framing.

poeticness (0=直白/direct, 100=文艺/poetic):
- High values: use lyrical, imagery-rich option text with literary quality.
- Low values: use plain, direct option text.
- This affects: option text wording.

OPTION EFFECT RULES:
- Each option must affect 1–3 factors.
- Effects are small integers from -3 to +3.
- Design options so different choices push the user vector in different directions.
- Use the reference result_vectors to understand what "directions" make sense, but do NOT mention result names in questions/options.

COVERAGE RULE:
- Every factor must be covered by at least one option across the entire question set.

PINNED QUESTIONS: Some questions may already be fixed (pinned) by the user. You will receive their text as reference. Do NOT generate questions that are highly similar in scenario or theme to pinned questions (e.g. if "你更喜欢哪种夜晚？" is pinned, do not generate "晚上你喜欢做什么？").

OUTPUT RULES:
- Output ONLY valid JSON. No markdown, no code fences, no explanation.
- Labels must be sequential uppercase letters: A, B, C, D...

Output format:
{
  "questions": [
    {
      "text": "你更喜欢哪种夜晚？",
      "description": "",
      "options": [
        {
          "label": "A",
          "text": "一个人听雨写东西",
          "factor_effects": {
            "sensitivity": 2,
            "imagination": 2,
            "expressiveness": -1
          }
        }
      ]
    }
  ]
}`;

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
    pinnedSection = `\n以下题目已经被用户固定，不要生成高度相似的新题目：\n${pinned_questions
      .map((q) => `- ${q.text}`)
      .join("\n")}\n`;
  }

  const styleSection = `\n风格控制参数：\n- 抽象度 = ${a}/100 ${a >= 70 ? "（多使用隐喻场景和想象力）" : a <= 30 ? "（使用真实日常场景）" : "（平衡真实与抽象）"}\n- 严肃度 = ${s}/100 ${s >= 70 ? "（正式、深刻，不搞怪）" : s <= 30 ? "（加入搞怪、娱乐化元素）" : "（平衡严肃与轻松）"}\n- 深度 = ${d}/100 ${d >= 70 ? "（关注价值观、内在冲突）" : d <= 30 ? "（关注表面偏好）" : "（平衡深度与轻松）"}\n- 文艺度 = ${p}/100 ${p >= 70 ? "（使用有画面感、文学感的表达）" : p <= 30 ? "（使用直白、简洁的表达）" : "（平衡文艺与直白）"}\n`;

  return `设计新一轮题目。这些题目用于一个基于因子向量计算的个性测试。

测试标题：${title}
测试副标题：${hook}
测试类型：${quiz_type}
目标受众：${audienceStr}
语气风格：${toneStr}
${styleSection}

当前结果人格（每个都配有在各因子上的参考值，不要直接用在题目里，只需要用它们了解不同的"方向"）：

结果人格：
${resultsText}

因子列表：
${factorsText}

上述结果人格对应的参考因子向量：
${resultVectorsText}
${pinnedSection}

请生成 ${question_count} 道选择题，每题 ${options_per_question} 个选项。要求：
- 每个 option 影响 1-3 个因子
- factor_effects 值为 -3 到 +3 之间的整数
- 所有 ${factorKeys.length} 个因子在整个题目集中都要有涉及
- 题目要场景化、有画面感、容易选、适合分享
- 严格按照风格控制参数调整题目的抽象度、严肃度、深度和选项的文艺度${
    pinned_questions?.length ? "\n- 不要生成与上述固定题目高度相似的新题目" : ""
  }`;
}
