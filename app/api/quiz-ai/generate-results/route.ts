import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackAISuccess, trackAIError, extractTokens } from "@/lib/ai/track-ai-usage";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCredits, spendCredit } from "@/lib/credits/service";
import {
  QUIZ_RESULTS_SYSTEM,
  buildQuizResultsPrompt,
} from "@/lib/prompts/quiz-results";
import type { ExistingResult } from "@/lib/prompts/quiz-results";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";

/* ------------------------------------------------------------------ */
/*  Merge: preserve non-empty fields from original pinned results      */
/* ------------------------------------------------------------------ */

function mergePinnedResult(
  original: ExistingResult,
  ai: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...ai };
  // Name: never override if original has one
  if (original.name && typeof original.name === "string" && original.name.trim()) {
    merged.name = original.name;
  }
  // Subtitle: keep original if non-empty
  if (original.subtitle && typeof original.subtitle === "string" && original.subtitle.trim()) {
    merged.subtitle = original.subtitle;
  }
  // Description: keep original if non-empty
  if (original.description && typeof original.description === "string" && original.description.trim()) {
    merged.description = original.description;
  }
  // Traits: keep original if non-empty array
  if (original.traits && Array.isArray(original.traits) && original.traits.length > 0) {
    merged.traits = original.traits;
  }
  // share_text: keep original if non-empty
  if (original.share_text && typeof original.share_text === "string" && original.share_text.trim()) {
    merged.share_text = original.share_text;
  }
  // image_url: never override if original has one
  if (original.image_url && typeof original.image_url === "string" && original.image_url.trim()) {
    merged.image_url = original.image_url;
  }
  // color: never override if original has one
  if (original.color && typeof original.color === "string" && original.color.trim()) {
    merged.color = original.color;
  }
  return merged;
}

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

  if (!checkRateLimit(`ai:results:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  // Credit check — fail fast before calling DeepSeek
  try {
    const snapshot = await getCredits(user.id);
    if (snapshot.balance.available <= 0) {
      return NextResponse.json({ error: "INSUFFICIENT_CREDITS" }, { status: 402 });
    }
  } catch (err) {
    console.error("[quiz-ai] Credit check failed:", err);
    return NextResponse.json({ error: "Credit check failed" }, { status: 500 });
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
    existing_results?: ExistingResult[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, title, hook, quiz_type, audience, tone, result_count, abstractness, seriousness, depth, poeticness, existing_results } = body;

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
    existing_results,
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
        client: supabase,
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
        client: supabase,
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
        client: supabase,
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
        client: supabase,
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

    // ---- Merge pinned results: preserve original non-empty fields ----
    let results = parsed.results as Record<string, unknown>[];
    const existingMap = new Map<string, ExistingResult>();
    if (existing_results) {
      for (const er of existing_results) {
        existingMap.set(er.key, er);
      }
    }

    if (existingMap.size > 0) {
      results = results.map((ai) => {
        const key = ai.key as string;
        const original = existingMap.get(key);
        if (original && original.is_pinned) {
          return mergePinnedResult(original, ai);
        }
        return ai;
      });

      // Ensure all pinned results are present in AI output
      for (const [key, original] of existingMap) {
        if (original.is_pinned && !results.some((r) => r.key === key)) {
          console.warn(`[quiz-ai] pinned result "${key}" missing from AI output, adding back`);
          results.push({
            key: original.key,
            name: original.name ?? key,
            subtitle: original.subtitle ?? "",
            description: original.description ?? "",
            traits: original.traits ?? [],
            share_text: original.share_text ?? "",
            image_url: original.image_url ?? "",
            color: original.color ?? "",
          });
        }
      }
    }

    // Validate each result has required fields
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
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

    // Spend credit + attach remaining to response
    let creditsRemaining: number | null = null;
    try {
      creditsRemaining = await spendCredit(user.id);
    } catch (err) {
      console.error("[quiz-ai] spendCredit failed:", err);
    }

    // Track success
    trackAISuccess({
        client: supabase,
        userId,
      feature: "quiz_generate_results",
      model: MODEL,
      ...extractTokens(dsData),
      metadata: { result_count: results.length },
    });

    return NextResponse.json({
      results,
      credits_remaining: creditsRemaining,
    });
  } catch (err) {
    console.error("[quiz-ai] Unexpected error", err);
    trackAIError({
        client: supabase,
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
