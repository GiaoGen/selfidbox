import { NextRequest, NextResponse } from "next/server";
import { SELFID_FACTORS, SELFID_FACTOR_KEYS } from "@/lib/selfid-factors";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a personality quiz designer. Your task is to SELECT dimensional factors (axes) from a predefined catalog for a quiz.

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
  if (count < 1 || count > 16) {
    return NextResponse.json(
      { error: "factor_count must be between 1 and 16" },
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

  const catalog = SELFID_FACTORS.map(
    (sf) => `- ${sf.key}（${sf.name}）：${sf.description}`,
  ).join("\n");

  const userMessage = `从以下因子库中选择适合这个测试的因子维度。

测试标题：${title}
测试副标题：${hookStr}
测试类型：${quiz_type ?? "personality"}
目标受众：${audienceStr}
语气风格：${toneStr}
因子数量：${count} 个

已有的结果人格：
${resultsSummary}
${pinnedSection}

可用因子库（只能从中选择，绝对不能自己创造 key）：
${catalog}

请从以上因子库中选择 ${count} 个能够有效区分这些结果人格的因子维度。${pinned_factors?.length ? "不能选择已被固定的因子。" : ""}每个因子必须能够产生足够的区分度——不能让所有结果在同一因子上看起来一样。返回的 key 必须与因子库中完全一致。`;

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

    const seenKeys = new Set<string>();
    for (let i = 0; i < parsed.factors.length; i++) {
      const f = parsed.factors[i];
      if (!f || typeof f !== "object") {
        return NextResponse.json(
          { error: `Factor ${i} is not an object` },
          { status: 502 },
        );
      }
      const obj = f as Record<string, unknown>;
      if (!obj.key || typeof obj.key !== "string" || !SELFID_FACTOR_KEYS.has(obj.key)) {
        return NextResponse.json(
          { error: `Factor ${i} key "${String(obj.key)}" is not a valid Selfid factor` },
          { status: 502 },
        );
      }
      if (seenKeys.has(obj.key)) {
        return NextResponse.json(
          { error: `Factor ${i} key "${obj.key}" appears more than once` },
          { status: 502 },
        );
      }
      seenKeys.add(obj.key);
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
