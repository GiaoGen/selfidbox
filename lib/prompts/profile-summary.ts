/* ------------------------------------------------------------------ */
/*  AI prompt builder: profile summary                                  */
/*                                                                      */
/*  Generates a one-line SelfID profile label from fused trait data.     */
/*  Called during profile rebuild (not on page load).                    */
/* ------------------------------------------------------------------ */

export const PROFILE_SUMMARY_SYSTEM = `You are a personality profile writer. Output ONLY one sentence — no markdown, no quotes, no explanation.

RULES:
- Write ONE sentence only, ≤35 Chinese characters.
- The PRIMARY input is the user's 16-dimension personality vector (core + social). This represents their LONG-TERM personality profile built from multiple data sources over time. Your summary MUST reflect these vectors first and foremost.
- Recent quiz results are provided only as light context — they are individual data points, NOT the main personality signal. DO NOT write a summary based on the most recent quiz result. The summary should describe enduring personality tendencies, not transient test outcomes.
- Tone: warm, slightly poetic, memorable — like a personal tagline.
- NOT medical, NOT diagnostic, NOT clinical. Never say "你患有" or "你有障碍" or "你表现出".
- NOT forced poetic, NOT cringe, NOT empty flattery.
- Pattern: describe the person's core personality tendencies revealed by the vectors. Example: "你是一个理性而敏感的人，总是在独立思考和情感共鸣之间寻找平衡。"
- Example: "你像一颗安静运转的行星，理性、敏感，也保留自己的轨道。"
- All text in Chinese.`;

export interface BuildProfileSummaryPromptInput {
  coreTraits: { label: string; value: number }[];
  socialTraits: { label: string; value: number }[];
  recentResults: string[];
  reportCount: number;
}

export function buildProfileSummaryPrompt(
  input: BuildProfileSummaryPromptInput,
): string {
  const { coreTraits, socialTraits, recentResults, reportCount } = input;

  const coreBlock =
    coreTraits.length > 0
      ? coreTraits
          .map((t) => {
            const dir = t.value >= 65 ? "偏高" : t.value <= 35 ? "偏低" : "中等";
            return `- ${t.label}：${dir}（${t.value}）`;
          })
          .join("\n")
      : "（无核心数据）";

  const socialBlock =
    socialTraits.length > 0
      ? socialTraits
          .map((t) => {
            const dir = t.value >= 65 ? "偏高" : t.value <= 35 ? "偏低" : "中等";
            return `- ${t.label}：${dir}（${t.value}）`;
          })
          .join("\n")
      : "（无社交数据）";

  const resultsBlock =
    recentResults.length > 0
      ? recentResults.map((r) => `- ${r}`).join("\n")
      : "（暂无）";

  return `生成一句人格摘要，描述这个人的长期人格倾向。

⚠️ 最重要：以下16维人格向量是核心输入。摘要必须基于这些向量反映长期人格，不要基于最近一次Quiz结果。

核心人格向量（8维）：
${coreBlock}

社会表达向量（8维）：
${socialBlock}

以上共16个维度，来自${reportCount}条数据的长期聚合。

参考上下文（次要，仅作为风格参考，不要直接描述这些结果）：
${resultsBlock}`;
}

/* ------------------------------------------------------------------ */
/*  Output cleaner                                                      */
/* ------------------------------------------------------------------ */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";

/**
 * Clean AI output for safe storage.
 * - Strip quotes, newlines, markdown
 * - Truncate to maxLen Chinese characters
 * - Keep only first sentence
 */
export function cleanProfileSummary(raw: string, maxLen = 60): string {
  let s = raw.trim();
  // Strip code fences
  if (s.startsWith("```")) {
    const fenceEnd = s.indexOf("\n");
    if (fenceEnd > 0) s = s.slice(fenceEnd + 1);
    if (s.endsWith("```")) s = s.slice(0, -3);
  }
  // Strip quotes
  s = s.replace(/^["'""「『]+/, "").replace(/["'""」』]+$/, "");
  // Strip newlines
  s = s.replace(/\n+/g, " ");
  // Keep only first sentence (split on 。！？! ?)
  const firstSentence = s.match(/^[^。！？!?]+[。！？!?]?/);
  if (firstSentence) s = firstSentence[0].trim();
  // Truncate to maxLen Chinese characters
  if (s.length > maxLen) {
    const truncated = s.slice(0, maxLen);
    const lastPeriod = Math.max(
      truncated.lastIndexOf("。"),
      truncated.lastIndexOf("！"),
      truncated.lastIndexOf("？"),
      truncated.lastIndexOf("，"),
    );
    s = lastPeriod > maxLen * 0.6 ? truncated.slice(0, lastPeriod + 1) : truncated;
  }
  return s.trim();
}

/* ------------------------------------------------------------------ */
/*  AI caller (used during profile rebuild)                            */
/* ------------------------------------------------------------------ */

export interface GenerateAISelfidProfileResult {
  text: string | null;
  tokens: { promptTokens: number; completionTokens: number; totalTokens: number };
}

/**
 * Call DeepSeek to generate a one-line selfid_profile.
 * Returns null if AI fails — caller should fall back to rule-based.
 */
export async function generateAISelfidProfile(
  coreTraits: { label: string; value: number }[],
  socialTraits: { label: string; value: number }[],
  recentResults: string[],
  reportCount: number,
): Promise<GenerateAISelfidProfileResult> {
  const userMessage = buildProfileSummaryPrompt({
    coreTraits,
    socialTraits,
    recentResults,
    reportCount,
  });

  const emptyTokens = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  if (!DEEPSEEK_API_KEY) {
    console.log("[ProfileSummary] no DEEPSEEK_API_KEY, skipping AI");
    return { text: null, tokens: emptyTokens };
  }

  try {
    const response = await fetch(DEEPSEEK_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: PROFILE_SUMMARY_SYSTEM },
          { role: "user", content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 128,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[ProfileSummary] DeepSeek API error ${response.status}`, errText.slice(0, 200));
      return { text: null, tokens: emptyTokens };
    }

    const data = await response.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";

    if (!raw) {
      console.error("[ProfileSummary] empty response from DeepSeek");
      return { text: null, tokens: emptyTokens };
    }

    const cleaned = cleanProfileSummary(raw);
    if (!cleaned) {
      console.error("[ProfileSummary] cleaned output empty");
      return { text: null, tokens: emptyTokens };
    }

    // Extract tokens
    const promptTokens = data?.usage?.prompt_tokens ?? 0;
    const completionTokens = data?.usage?.completion_tokens ?? 0;
    const totalTokens = data?.usage?.total_tokens ?? promptTokens + completionTokens;

    console.log(`[ProfileSummary] AI generated: "${cleaned}"`);
    return {
      text: cleaned,
      tokens: { promptTokens, completionTokens, totalTokens },
    };
  } catch (err) {
    console.error("[ProfileSummary] unexpected error", err);
    return { text: null, tokens: emptyTokens };
  }
}
