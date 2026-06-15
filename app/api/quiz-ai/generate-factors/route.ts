import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SELFID_FACTOR_KEYS } from "@/lib/selfid-factors";
import { checkRateLimit } from "@/lib/rate-limit";
import { trackAISuccess, trackAIError, extractTokens } from "@/lib/ai/track-ai-usage";
import {
  QUIZ_FACTORS_SYSTEM,
  buildQuizFactorsPrompt,
} from "@/lib/prompts/quiz-factors";

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  if (!checkRateLimit(`ai:factors:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  let body: {
    userId?: string;
    title?: string;
    hook?: string;
    quiz_type?: string;
    audience?: string[];
    tone?: string[];
    results?: { key: string; name: string; subtitle?: string; description: string; traits: string[] }[];
    factor_count?: number;
    pinned_factors?: { key: string; name: string }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, title, hook, quiz_type, audience, tone, results, factor_count, pinned_factors } = body;

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

  const userMessage = buildQuizFactorsPrompt({
    title,
    hook: hookStr,
    quiz_type: quiz_type ?? "personality",
    audienceStr,
    toneStr,
    results: (results ?? []).map((r) => ({
      key: r.key,
      name: r.name,
      subtitle: r.subtitle ?? "",
      description: r.description ?? "",
      traits: r.traits ?? [],
    })),
    count,
    pinned_factors,
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
          { role: "system", content: QUIZ_FACTORS_SYSTEM },
          { role: "user", content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 3072,
      }),
    });

    if (!dsResponse.ok) {
      const errText = await dsResponse.text().catch(() => "");
      console.error("[quiz-ai:factors] DeepSeek API error", dsResponse.status, errText);
      trackAIError({
        client: supabase,
        userId,
        feature: "quiz_generate_factors",
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
      console.error("[quiz-ai:factors] Empty response from DeepSeek", dsData);
      trackAIError({
        client: supabase,
        userId,
        feature: "quiz_generate_factors",
        model: MODEL,
        errorMessage: "AI returned empty response",
      });
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
      trackAIError({
        client: supabase,
        userId,
        feature: "quiz_generate_factors",
        model: MODEL,
        ...extractTokens(dsData),
        errorMessage: "AI returned invalid JSON",
      });
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 502 },
      );
    }

    if (!parsed.factors || !Array.isArray(parsed.factors)) {
      trackAIError({
        client: supabase,
        userId,
        feature: "quiz_generate_factors",
        model: MODEL,
        errorMessage: "AI response missing factors array",
      });
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

    trackAISuccess({
        client: supabase,
        userId,
      feature: "quiz_generate_factors",
      model: MODEL,
      ...extractTokens(dsData),
      metadata: { factor_count: parsed.factors.length },
    });

    return NextResponse.json({ factors: parsed.factors });
  } catch (err) {
    console.error("[quiz-ai:factors] Unexpected error", err);
    trackAIError({
        client: supabase,
        userId,
      feature: "quiz_generate_factors",
      model: MODEL,
      errorMessage: err instanceof Error ? err.message : "Internal server error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
