import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a personality quiz designer. Your task is to generate distinct personality result types for a quiz.

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

export async function POST(request: NextRequest) {
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json(
      { error: "DeepSeek API key not configured" },
      { status: 500 },
    );
  }

  let body: {
    title?: string;
    hook?: string;
    quiz_type?: string;
    audience?: string[];
    tone?: string[];
    result_count?: number;
    abstractness?: number;
    seriousness?: number;
    depth?: number;
    poeticness?: number;
    pinned_results?: { key: string; name: string; traits: string[] }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, hook, quiz_type, audience, tone, result_count, abstractness, seriousness, depth, poeticness, pinned_results } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!result_count || typeof result_count !== "number" || result_count < 1 || result_count > 16) {
    return NextResponse.json(
      { error: "result_count must be between 1 and 16" },
      { status: 400 },
    );
  }

  const audienceStr = audience?.length ? audience.join("、") : "一般大众";
  const toneStr = tone?.length ? tone.join("、") : "中性";
  const hookStr = hook || "";
  const typeStr = quiz_type || "personality";

  const a = abstractness ?? 50;
  const s = seriousness ?? 50;
  const d = depth ?? 50;
  const p = poeticness ?? 50;

  let pinnedSection = "";
  if (pinned_results && pinned_results.length > 0) {
    pinnedSection = `\n以下结果人格已经被用户固定，千万不要重复或生成语义相似的结果：\n${pinned_results
      .map((p) => `- ${p.name}（key: ${p.key}，特质：${p.traits.join("、")}）`)
      .join("\n")}\n`;
  }

  let styleSection = `\n风格控制参数：\n- 抽象度 = ${a}/100 ${a >= 70 ? "（多用隐喻和想象场景，减少现实场景）" : a <= 30 ? "（使用真实日常场景和直白表达）" : "（平衡真实与抽象）"}\n- 严肃度 = ${s}/100 ${s >= 70 ? "（正式、分析性表达，不要搞怪）" : s <= 30 ? "（加入搞怪、娱乐化元素，轻松有趣）" : "（平衡严肃与轻松）"}\n- 深度 = ${d}/100 ${d >= 70 ? "（关注价值观、内在冲突、哲学性问题）" : d <= 30 ? "（关注表面偏好、轻松话题）" : "（平衡深度与轻松）"}\n- 文艺度 = ${p}/100 ${p >= 70 ? "（使用有画面感、文学感的表达，如诗歌般的语言）" : p <= 30 ? "（使用直白、简洁的陈述句）" : "（平衡文艺与直白）"}\n`;

  const userMessage = `设计一个人格测试的结果类型。

测试标题：${title}
测试副标题：${hookStr}
测试类型：${typeStr}
目标受众：${audienceStr}
语气风格：${toneStr}
结果数量：${result_count} 个
${styleSection}${pinnedSection}
请生成 ${result_count} 个有明显区分度的人格结果。${pinned_results?.length ? "新生成的结果必须与上述固定结果有明显区分度，不能重复或高度相似。" : ""}每个结果的 key 使用英文 snake_case。请严格按照风格控制参数调整生成内容的抽象度、严肃度、深度和文艺度。`;

  try {
    const dsResponse = await fetch(DEEPSEEK_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.85,
        max_tokens: 4096,
      }),
    });

    if (!dsResponse.ok) {
      const errText = await dsResponse.text().catch(() => "");
      console.error("[quiz-ai] DeepSeek API error", dsResponse.status, errText);
      return NextResponse.json(
        { error: `DeepSeek API returned ${dsResponse.status}` },
        { status: 502 },
      );
    }

    const dsData = await dsResponse.json();
    const rawContent: string =
      dsData?.choices?.[0]?.message?.content ?? "";

    if (!rawContent) {
      console.error("[quiz-ai] Empty response from DeepSeek", dsData);
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 502 },
      );
    }

    // Strip markdown code fences if present
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      const fenceEnd = jsonStr.indexOf("\n");
      jsonStr = jsonStr.slice(fenceEnd + 1);
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3).trim();
      }
    }

    let parsed: { results?: unknown[] };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("[quiz-ai] Failed to parse AI JSON", jsonStr.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 502 },
      );
    }

    if (!parsed.results || !Array.isArray(parsed.results)) {
      return NextResponse.json(
        { error: "AI response missing results array" },
        { status: 502 },
      );
    }

    // Validate each result has required fields
    for (let i = 0; i < parsed.results.length; i++) {
      const r = parsed.results[i];
      if (!r || typeof r !== "object") {
        return NextResponse.json(
          { error: `Result ${i} is not an object` },
          { status: 502 },
        );
      }
      const obj = r as Record<string, unknown>;
      if (!obj.key || typeof obj.key !== "string") {
        return NextResponse.json(
          { error: `Result ${i} missing valid key` },
          { status: 502 },
        );
      }
      if (!obj.name || typeof obj.name !== "string") {
        return NextResponse.json(
          { error: `Result ${i} missing valid name` },
          { status: 502 },
        );
      }
      if (!Array.isArray(obj.traits)) {
        return NextResponse.json(
          { error: `Result ${i} missing valid traits array` },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ results: parsed.results });
  } catch (err) {
    console.error("[quiz-ai] Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
