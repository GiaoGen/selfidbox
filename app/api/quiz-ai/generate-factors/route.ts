import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a personality quiz designer. Your task is to design the dimensional factors (axes) that make up a personality space for a quiz.

Rules:
- Output ONLY valid JSON. No markdown, no code fences, no explanation.
- Each factor should be a measurable personality dimension (e.g. sensitivity, expressiveness, orderliness).
- Factors must be able to differentiate the given results — no two results should look identical across all factors.
- Factors should be specific and concrete, not vague or overlapping.
- All text in Chinese except "key" which must be English snake_case.

PINNED FACTORS: Some factors may already be fixed (pinned) by the user. You will receive a list of pinned factors. You MUST:
- NOT generate any factor with the same key as a pinned factor.
- NOT generate factors that are semantically overlapping with pinned factors (e.g. if "敏感度" is pinned, do not generate "情绪感知力" which means the same thing).
- Ensure every new factor measures a genuinely different dimension from all pinned factors.

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
    results?: { key: string; name: string; description: string; traits: string[] }[];
    factor_count?: number;
    pinned_factors?: { key: string; name: string }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, hook, quiz_type, audience, tone, results, factor_count, pinned_factors } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!results || !Array.isArray(results) || results.length < 1) {
    return NextResponse.json(
      { error: "results array with at least 1 item is required" },
      { status: 400 },
    );
  }

  const count = factor_count && typeof factor_count === "number" ? factor_count : 5;
  if (count < 1 || count > 8) {
    return NextResponse.json(
      { error: "factor_count must be between 1 and 8" },
      { status: 400 },
    );
  }

  const audienceStr = audience?.length ? audience.join("、") : "一般大众";
  const toneStr = tone?.length ? tone.join("、") : "中性";
  const hookStr = hook || "";

  const resultsSummary = results
    .map(
      (r) =>
        `- ${r.name}（${r.key}）：${r.description} 特质：[${(r.traits ?? []).join("、")}]`,
    )
    .join("\n");

  let pinnedSection = "";
  if (pinned_factors && pinned_factors.length > 0) {
    pinnedSection = `\n以下因子已经被用户固定，千万不要重复或生成语义重复的因子：\n${pinned_factors
      .map((p) => `- ${p.name}（key: ${p.key}）`)
      .join("\n")}\n`;
  }

  const userMessage = `设计一个人格测试的因子维度。

测试标题：${title}
测试副标题：${hookStr}
测试类型：${quiz_type ?? "personality"}
目标受众：${audienceStr}
语气风格：${toneStr}
因子数量：${count} 个

已有的结果人格：
${resultsSummary}
${pinnedSection}
请设计 ${count} 个能够有效区分这些结果人格的因子维度。${pinned_factors?.length ? "新生成的因子必须与上述固定因子有明确区分度，不能语义重复。" : ""}每个因子必须能够产生足够的区分度——不能让所有结果在同一因子上看起来一样。`;

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
        temperature: 0.8,
        max_tokens: 3072,
      }),
    });

    if (!dsResponse.ok) {
      const errText = await dsResponse.text().catch(() => "");
      console.error("[quiz-ai:factors] DeepSeek API error", dsResponse.status, errText);
      return NextResponse.json(
        { error: `DeepSeek API returned ${dsResponse.status}` },
        { status: 502 },
      );
    }

    const dsData = await dsResponse.json();
    const rawContent: string = dsData?.choices?.[0]?.message?.content ?? "";

    if (!rawContent) {
      console.error("[quiz-ai:factors] Empty response from DeepSeek", dsData);
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 502 },
      );
    }

    // Strip markdown code fences
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      const fenceEnd = jsonStr.indexOf("\n");
      jsonStr = jsonStr.slice(fenceEnd + 1);
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3).trim();
      }
    }

    let parsed: { factors?: unknown[] };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("[quiz-ai:factors] Failed to parse AI JSON", jsonStr.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 502 },
      );
    }

    if (!parsed.factors || !Array.isArray(parsed.factors)) {
      return NextResponse.json(
        { error: "AI response missing factors array" },
        { status: 502 },
      );
    }

    for (let i = 0; i < parsed.factors.length; i++) {
      const f = parsed.factors[i];
      if (!f || typeof f !== "object") {
        return NextResponse.json(
          { error: `Factor ${i} is not an object` },
          { status: 502 },
        );
      }
      const obj = f as Record<string, unknown>;
      if (!obj.key || typeof obj.key !== "string") {
        return NextResponse.json(
          { error: `Factor ${i} missing valid key` },
          { status: 502 },
        );
      }
      if (!obj.name || typeof obj.name !== "string") {
        return NextResponse.json(
          { error: `Factor ${i} missing valid name` },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ factors: parsed.factors });
  } catch (err) {
    console.error("[quiz-ai:factors] Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
