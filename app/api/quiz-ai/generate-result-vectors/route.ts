import { NextRequest, NextResponse } from "next/server";
import { trackAISuccess, trackAIError, extractTokens } from "@/lib/ai/track-ai-usage";
import {
  QUIZ_RESULT_VECTORS_SYSTEM,
  buildQuizResultVectorsPrompt,
} from "@/lib/prompts/quiz-result-vectors";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";

export async function POST(request: NextRequest) {
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json(
      { error: "DeepSeek API key not configured" },
      { status: 500 },
    );
  }

  let body: {
    userId?: string;
    title?: string;
    hook?: string;
    quiz_type?: string;
    audience?: string[];
    tone?: string[];
    results?: { key: string; name: string; description: string; traits: string[] }[];
    factors?: { key: string; name: string; description?: string }[];
    pinned_vectors?: { key: string; name: string; values: Record<string, number> }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, title, hook, quiz_type, audience, tone, results, factors, pinned_vectors } = body;

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!results || !Array.isArray(results) || results.length < 1) {
    return NextResponse.json(
      { error: "results array with at least 1 item is required" },
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

  let pinnedText = "";
  if (pinned_vectors && pinned_vectors.length > 0) {
    pinnedText = `\n以下结果向量已经被用户固定，不需要生成：\n${pinned_vectors
      .map((p) => {
        const highs = Object.entries(p.values).filter(([, v]) => v >= 80).map(([k]) => k).join("、") || "无";
        const lows = Object.entries(p.values).filter(([, v]) => v <= 30).map(([k]) => k).join("、") || "无";
        return `- ${p.name}（${p.key}）：高=[${highs}] 低=[${lows}]（已固定）`;
      })
      .join("\n")}\n`;
  }

  const userMessage = buildQuizResultVectorsPrompt({
    title: title ?? "",
    hook,
    quiz_type,
    audienceStr,
    toneStr,
    resultsText,
    factorsText,
    pinnedText,
  });

  try {
    const dsResponse = await fetch(DEEPSEEK_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: QUIZ_RESULT_VECTORS_SYSTEM },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!dsResponse.ok) {
      const errText = await dsResponse.text().catch(() => "");
      console.error("[quiz-ai:vectors] DeepSeek API error", dsResponse.status, errText);
      trackAIError({
        userId,
        feature: "quiz_generate_result_vectors",
        model: MODEL,
        errorMessage: `DeepSeek API returned ${dsResponse.status}`,
      });
      return NextResponse.json(
        { error: `DeepSeek API returned ${dsResponse.status}` },
        { status: 502 },
      );
    }

    const dsData = await dsResponse.json();
    const rawContent: string = dsData?.choices?.[0]?.message?.content ?? "";

    if (!rawContent) {
      console.error("[quiz-ai:vectors] Empty response from DeepSeek", dsData);
      trackAIError({
        userId,
        feature: "quiz_generate_result_vectors",
        model: MODEL,
        errorMessage: "AI returned empty response",
      });
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
      trackAIError({
        userId,
        feature: "quiz_generate_result_vectors",
        model: MODEL,
        ...extractTokens(dsData),
        errorMessage: "AI returned invalid JSON",
      });
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

    const resultCount = Object.keys(parsed.result_vectors).length;
    trackAISuccess({
      userId,
      feature: "quiz_generate_result_vectors",
      model: MODEL,
      ...extractTokens(dsData),
      metadata: { result_count: resultCount },
    });

    return NextResponse.json({ result_vectors: parsed.result_vectors });
  } catch (err) {
    console.error("[quiz-ai:vectors] Unexpected error", err);
    trackAIError({
      userId,
      feature: "quiz_generate_result_vectors",
      model: MODEL,
      errorMessage: err instanceof Error ? err.message : "Internal server error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
