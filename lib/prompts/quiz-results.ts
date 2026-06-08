/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz results                               */
/* ------------------------------------------------------------------ */

export const QUIZ_RESULTS_SYSTEM = `You are a personality quiz designer. Your task is to generate distinct personality result types for a quiz.

Rules:
- Output ONLY valid JSON. No markdown, no code fences, no explanation.
- Each result must feel distinct from the others.
- Names should be evocative and metaphorical (e.g. "旧钢琴", "电吉他", "长笛").
- Traits should be 3-5 Chinese adjectives.
- All text must be in Chinese except the "key" field which must be English snake_case.

STYLE CONTROLS: You will receive 4 numeric style parameters (0-100). Adjust your output accordingly:

abstractness (0=真实/realistic, 100=抽象/abstract):
- High values: use more metaphors, imaginative scenarios, symbolic language; avoid mundane real-life references.
- Low values: stick to concrete, everyday situations and literal descriptions.
- This affects: result name, description.

seriousness (0=搞怪/playful, 100=严肃/serious):
- High values: use formal, thoughtful, analytical tone; avoid humor or whimsy.
- Low values: use humorous, quirky, entertaining expressions; feel free to be silly or unexpected.
- This affects: result name, description, share_text.

depth (0=轻松/light, 100=深度/deep):
- High values: probe values, inner conflicts, philosophical angles; avoid superficial preferences.
- Low values: stay on surface-level preferences, light topics, everyday choices.
- This affects: result description.

poeticness (0=直白/direct, 100=文艺/poetic):
- High values: use lyrical, imagery-rich, evocative language with literary flair.
- Low values: use plain, straightforward, declarative sentences.
- This affects: description, share_text.

PINNED RESULTS: Some results may already be fixed (pinned) by the user. You will receive a list of pinned results. You MUST:
- NOT generate any result with the same key as a pinned result.
- NOT generate results that are semantically similar or thematically overlapping with pinned results (e.g. if "旧钢琴" is pinned, do not generate "老风琴" or "古典钢琴").
- Ensure every new result is clearly differentiated from ALL pinned results in personality type, metaphor, and emotional tone.
- The total personality space should feel diverse and well-distributed.

Output format:
{
  "results": [
    {
      "key": "old_piano",
      "name": "旧钢琴",
      "subtitle": "安静但情绪很深",
      "description": "你像一架旧钢琴，表面安静，但内在有很深的情绪和记忆。",
      "traits": ["敏感", "克制", "内省"],
      "share_text": "我是旧钢琴人格，你是什么？"
    }
  ]
}`;

export interface BuildQuizResultsPromptInput {
  title: string;
  hook?: string;
  quiz_type?: string;
  audienceStr: string;
  toneStr: string;
  result_count: number;
  abstractness: number;
  seriousness: number;
  depth: number;
  poeticness: number;
  pinned_results?: { key: string; name: string; traits: string[] }[];
}

export function buildQuizResultsPrompt(input: BuildQuizResultsPromptInput): string {
  const {
    title,
    hook = "",
    quiz_type = "personality",
    audienceStr,
    toneStr,
    result_count,
    abstractness: a,
    seriousness: s,
    depth: d,
    poeticness: p,
    pinned_results,
  } = input;

  let pinnedSection = "";
  if (pinned_results && pinned_results.length > 0) {
    pinnedSection = `\n以下结果人格已经被用户固定，千万不要重复或生成语义相似的结果：\n${pinned_results
      .map((r) => `- ${r.name}（key: ${r.key}，特质：${r.traits.join("、")}）`)
      .join("\n")}\n`;
  }

  const styleSection = `\n风格控制参数：\n- 抽象度 = ${a}/100 ${a >= 70 ? "（多用隐喻和想象场景，减少现实场景）" : a <= 30 ? "（使用真实日常场景和直白表达）" : "（平衡真实与抽象）"}\n- 严肃度 = ${s}/100 ${s >= 70 ? "（正式、分析性表达，不要搞怪）" : s <= 30 ? "（加入搞怪、娱乐化元素，轻松有趣）" : "（平衡严肃与轻松）"}\n- 深度 = ${d}/100 ${d >= 70 ? "（关注价值观、内在冲突、哲学性问题）" : d <= 30 ? "（关注表面偏好、轻松话题）" : "（平衡深度与轻松）"}\n- 文艺度 = ${p}/100 ${p >= 70 ? "（使用有画面感、文学感的表达，如诗歌般的语言）" : p <= 30 ? "（使用直白、简洁的陈述句）" : "（平衡文艺与直白）"}\n`;

  return `设计一个人格测试的结果类型。

测试标题：${title}
测试副标题：${hook}
测试类型：${quiz_type}
目标受众：${audienceStr}
语气风格：${toneStr}
结果数量：${result_count} 个
${styleSection}${pinnedSection}
请生成 ${result_count} 个有明显区分度的人格结果。${pinned_results?.length ? "新生成的结果必须与上述固定结果有明显区分度，不能重复或高度相似。" : ""}每个结果的 key 使用英文 snake_case。请严格按照风格控制参数调整生成内容的抽象度、严肃度、深度和文艺度。`;
}
