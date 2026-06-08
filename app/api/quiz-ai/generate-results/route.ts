import { NextRequest, NextResponse } from "next/server";
import { trackAISuccess, trackAIError, extractTokens } from "@/lib/ai/track-ai-usage";
import {
  QUIZ_RESULTS_SYSTEM,
  buildQuizResultsPrompt,
} from "@/lib/prompts/quiz-results";

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

  const { userId, title, hook, quiz_type, audience, tone, result_count, abstractness, seriousness, depth, poeticness, pinned_results } = body;

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

  const userMessage = buildQuizResultsPrompt({
    title,
    hook: hookStr,
    quiz_type: typeStr,
    audienceStr,
    toneStr,
    result_count,
    abstractness: a,
    seriousness: s,
    depth: d,
    poeticness: p,
    pinned_results,
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
          { role: "system", content: QUIZ_RESULTS_SYSTEM },
          { role: "user", content: userMessage },
        ],
        temperature: 0.85,
        max_tokens: 4096,
      }),
    });

    if (!dsResponse.ok) {
      const errText = await dsResponse.text().catch(() => "");
      console.error("[quiz-ai] DeepSeek API error", dsResponse.status, errText);
      trackAIError({
        userId,
        feature: "quiz_generate_results",
        model: MODEL,
        errorMessage: `DeepSeek API returned ${dsResponse.status}`,
      });
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
      trackAIError({
        userId,
        feature: "quiz_generate_results",
        model: MODEL,
        errorMessage: "AI returned empty response",
      });
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
      trackAIError({
        userId,
        feature: "quiz_generate_results",
        model: MODEL,
        errorMessage: "AI returned invalid JSON",
        ...extractTokens(dsData),
      });
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 502 },
      );
    }

    if (!parsed.results || !Array.isArray(parsed.results)) {
      trackAIError({
        userId,
        feature: "quiz_generate_results",
        model: MODEL,
        errorMessage: "AI response missing results array",
      });
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

    // Track success
    trackAISuccess({
      userId,
      feature: "quiz_generate_results",
      model: MODEL,
      ...extractTokens(dsData),
      metadata: { result_count: parsed.results.length },
    });

    return NextResponse.json({ results: parsed.results });
  } catch (err) {
    console.error("[quiz-ai] Unexpected error", err);
    trackAIError({
      userId,
      feature: "quiz_generate_results",
      model: MODEL,
      errorMessage: err instanceof Error ? err.message : "Internal server error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
