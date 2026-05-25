import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a personality quiz designer. Your task is to assign 0-100 vector values for each result personality across each factor dimension.

Rules:
- Output ONLY valid JSON. No markdown, no code fences, no explanation.
- Each result must have a value for EVERY factor.
- All values must be integers from 0 to 100.
- Core matching traits should score high (80–95).
- Clearly non-matching traits should score low (10–30).
- Neutral/irrelevant traits should sit in the middle (40–60).
- Results must be clearly differentiated — do NOT give all results similar values.
- Avoid extremes (0 or 100) unless absolutely certain.

Output format:
{
  "result_vectors": {
    "result_key_1": {
      "factor_key_1": 90,
      "factor_key_2": 20
    },
    "result_key_2": {
      "factor_key_1": 45,
      "factor_key_2": 95
    }
  }
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
    factors?: { key: string; name: string; description?: string }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, hook, quiz_type, audience, tone, results, factors } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!results || !Array.isArray(results) || results.length < 2) {
    return NextResponse.json(
      { error: "results array with at least 2 items is required" },
      { status: 400 },
    );
  }
  if (!factors || !Array.isArray(factors) || factors.length < 2) {
    return NextResponse.json(
      { error: "factors array with at least 2 items is required" },
      { status: 400 },
    );
  }

  const audienceStr = audience?.length ? audience.join("、") : "一般大众";
  const toneStr = tone?.length ? tone.join("、") : "中性";

  const resultsText = results
    .map(
      (r) =>
        `- ${r.name}（key: ${r.key}）：${r.description} 特质：[${(r.traits ?? []).join("、")}]`,
    )
    .join("\n");

  const factorsText = factors
    .map((f) => `- ${f.key}（${f.name}）：${f.description ?? ""}`)
    .join("\n");

  const userMessage = `为测试的人格结果分配向量值。

测试标题：${title}
测试副标题：${hook ?? ""}
测试类型：${quiz_type ?? "personality"}
目标受众：${audienceStr}
语气风格：${toneStr}

结果人格：
${resultsText}

因子维度：
${factorsText}

请为每个结果在每个因子上分配 0-100 的值。记住：
- 核心匹配的特征高到 80-95
- 明显不符合的特征低到 10-30
- 中性特征 40-60
- 不同结果之间要有明显区分度`;

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
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!dsResponse.ok) {
      const errText = await dsResponse.text().catch(() => "");
      console.error("[quiz-ai:vectors] DeepSeek API error", dsResponse.status, errText);
      return NextResponse.json(
        { error: `DeepSeek API returned ${dsResponse.status}` },
        { status: 502 },
      );
    }

    const dsData = await dsResponse.json();
    const rawContent: string = dsData?.choices?.[0]?.message?.content ?? "";

    if (!rawContent) {
      console.error("[quiz-ai:vectors] Empty response from DeepSeek", dsData);
      return NextResponse.json(
        { error: "AI returned empty response" },
        { status: 502 },
      );
    }

    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      const fenceEnd = jsonStr.indexOf("\n");
      jsonStr = jsonStr.slice(fenceEnd + 1);
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3).trim();
      }
    }

    let parsed: { result_vectors?: Record<string, unknown> };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("[quiz-ai:vectors] Failed to parse AI JSON", jsonStr.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 502 },
      );
    }

    if (!parsed.result_vectors || typeof parsed.result_vectors !== "object") {
      return NextResponse.json(
        { error: "AI response missing result_vectors object" },
        { status: 502 },
      );
    }

    const vectors = parsed.result_vectors as Record<string, unknown>;
    const resultKeys = new Set(results.map((r) => r.key));
    const factorKeys = new Set(factors.map((f) => f.key));

    for (const rk of resultKeys) {
      const vec = vectors[rk];
      if (!vec || typeof vec !== "object") {
        return NextResponse.json(
          { error: `Missing or invalid vector for result "${rk}"` },
          { status: 502 },
        );
      }
      const vals = vec as Record<string, unknown>;
      for (const fk of factorKeys) {
        const v = vals[fk];
        if (typeof v !== "number" || v < 0 || v > 100) {
          return NextResponse.json(
            { error: `Invalid value for result "${rk}" factor "${fk}": ${v}` },
            { status: 502 },
          );
        }
      }
    }

    return NextResponse.json({ result_vectors: parsed.result_vectors });
  } catch (err) {
    console.error("[quiz-ai:vectors] Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
