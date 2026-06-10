/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz results                               */
/* ------------------------------------------------------------------ */

export const QUIZ_RESULTS_SYSTEM = `You are a quiz result designer. Output ONLY valid JSON — no markdown, no code fences, no explanation.

THEME ANCHORING (highest priority, overrides everything else):
The quiz title defines a CATEGORY. Every result MUST be a concrete member of that category.
- "你是哪张专辑" → results are album-style names (月之暗面, 蓝色狂想曲, 加州旅馆)
- "你是哪种猫" → results are cat breeds/types (橘猫, 布偶猫, 缅因猫)
- "你是什么天气" → results are weather types (暴雨, 薄雾, 晴空万里)
- "你是哪种咖啡" → results are coffee types (美式, 拿铁, 冷萃)
- "你的性格类型是？" → ONLY then may you use personality-type labels
- FORBIDDEN unless title literally asks for personality types: 理性型, 感性型, 探索者, 守护者, 思考者, 治愈者, 领导者, 艺术家型, 哲学家型, 自由灵魂, 温柔观察者 — any generic personality label

RULES:
- Generate EXACTLY the requested result_count. No more, no less.
- Every result must feel clearly different — if two feel similar, drop one and make a replacement.
- key: English snake_case. All other text: Chinese.
- name: the concrete theme member (an album name, a cat breed — NOT a personality label).
- subtitle: short, punchy tagline (optional but recommended).
- description: connect the theme member to personality. Pattern: "你像[theme result]，[what this says about you as a person]..."
- traits: 3-5 Chinese adjectives for the personality behind this result.
- share_text: memorable 1-liner. Pattern: "我是[name]，你是什么？"
- Share-worthy and memorable. Not cringe. Not forced poetic. Not empty.

STYLE (0-100, applied to name/description/share_text):
abstractness: 0=concrete/everyday 100=metaphorical/imaginative
seriousness: 0=playful/humorous 100=serious/formal
depth: 0=surface/preferences 100=values/inner-world
poeticness: 0=direct/plain 100=lyrical/imagery-rich
Theme anchoring always overrides style.

PINNED RESULTS: When provided in the input, do NOT generate any result with the same key or a semantically/thematically overlapping result. The total set (pinned + new) must feel diverse.

OUTPUT:
{"results":[{"key":"english_key","name":"主题具体答案","subtitle":"简短副标题","description":"人格化解释描述…","traits":["特质1","特质2","特质3"],"share_text":"分享文案"}]}`;

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

export function buildQuizResultsPrompt(
  input: BuildQuizResultsPromptInput,
): string {
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

  let pinnedBlock = "";
  if (pinned_results && pinned_results.length > 0) {
    pinnedBlock = `\n已固定的结果（禁止重复 key 或语义相似）：\n${pinned_results
      .map((r) => `- ${r.name}（key: ${r.key}，特质：${r.traits.join("、")}）`)
      .join("\n")}`;
  }

  return `标题：「${title}」${hook ? ` 副标题：「${hook}」` : ""}
类型：${quiz_type} | 受众：${audienceStr} | 语气：${toneStr}
风格：抽象度${a}/100 严肃度${s}/100 深度${d}/100 文艺度${p}/100
生成数量：${result_count}${pinnedBlock}`;
}
