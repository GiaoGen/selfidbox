import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackAISuccess, trackAIError, extractTokens } from "@/lib/ai/track-ai-usage";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCredits, spendCredit } from "@/lib/credits/service";
import {
  QUIZ_QUESTIONS_SYSTEM,
  buildQuizQuestionsPrompt,
  resolveStyleStrategy,
} from "@/lib/prompts/quiz-questions";
import type { ExistingQuestion } from "@/lib/prompts/quiz-questions";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";

/* ------------------------------------------------------------------ */
/*  Merge: preserve non-empty fields from pinned questions             */
/* ------------------------------------------------------------------ */

function mergePinnedQuestion(
  original: ExistingQuestion,
  ai: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...ai };

  // Text: never override if original has non-empty text
  if (original.text && typeof original.text === "string" && original.text.trim()) {
    merged.text = original.text;
  }
  // Description: keep original if non-empty
  if (
    original.description &&
    typeof original.description === "string" &&
    original.description.trim()
  ) {
    merged.description = original.description;
  }

  // Options: merge option by option
  const aiOptions = (merged.options as Record<string, unknown>[]) ?? [];
  const origOptions = original.options ?? [];

  if (origOptions.length > 0) {
    const mergedOptions: Record<string, unknown>[] = [];
    for (let i = 0; i < Math.max(aiOptions.length, origOptions.length); i++) {
      const aiOpt = aiOptions[i] as Record<string, unknown> | undefined;
      const origOpt = origOptions[i];

      if (!origOpt) {
        // No original option — use AI
        if (aiOpt) mergedOptions.push(aiOpt);
        continue;
      }

      const mergedOpt: Record<string, unknown> = aiOpt ? { ...aiOpt } : { label: origOpt.label ?? "A" };
      // Keep original label if present
      if (origOpt.label) mergedOpt.label = origOpt.label;
      // Keep original text if non-empty
      if (origOpt.text && typeof origOpt.text === "string" && origOpt.text.trim()) {
        mergedOpt.text = origOpt.text;
        // Keep AI factor_effects if original has none
        if (
          origOpt.factor_effects &&
          typeof origOpt.factor_effects === "object" &&
          Object.keys(origOpt.factor_effects).length > 0
        ) {
          mergedOpt.factor_effects = origOpt.factor_effects;
        }
        // else: keep AI's factor_effects (already in mergedOpt from spread)
      } else {
        // Original option text is empty — use AI's text and effects
        if (aiOpt) {
          mergedOpt.text = aiOpt.text;
          mergedOpt.factor_effects = aiOpt.factor_effects;
        }
      }

      mergedOptions.push(mergedOpt);
    }
    merged.options = mergedOptions;
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

  // Rate limit: 20 requests per minute per user
  if (!checkRateLimit(`ai:questions:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  try {
    const snapshot = await getCredits(user.id);
    if (snapshot.balance.available <= 0) {
      return NextResponse.json({ error: "INSUFFICIENT_CREDITS" }, { status: 402 });
    }
  } catch (err) {
    console.error("[quiz-ai:questions] Credit check failed:", err);
    return NextResponse.json({ error: "Credit check failed" }, { status: 500 });
  }

  let body: {
    userId?: string;
    title?: string;
    hook?: string;
    quiz_type?: string;
    audience?: string[];
    tone?: string[];
    abstractness?: number;
    seriousness?: number;
    depth?: number;
    poeticness?: number;
    title_relevance?: number;
    goofiness?: number;
    results?: { key: string; name: string; description: string; traits: string[] }[];
    factors?: { key: string; name: string; description?: string }[];
    result_vectors?: Record<string, Record<string, number>>;
    question_count?: number;
    options_per_question?: number;
    existing_questions?: ExistingQuestion[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    userId,
    title,
    hook,
    quiz_type,
    audience,
    tone,
    abstractness,
    seriousness,
    depth,
    poeticness,
    title_relevance,
    goofiness,
    results,
    factors,
    result_vectors,
    question_count = 8,
    options_per_question = 4,
    existing_questions,
  } = body;

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

  const qc = typeof question_count === "number" ? question_count : 8;
  const opq = typeof options_per_question === "number" ? options_per_question : 4;

  if (qc < 1 || qc > 20) {
    return NextResponse.json(
      { error: "question_count must be between 1 and 20" },
      { status: 400 },
    );
  }
  if (opq < 2 || opq > 6) {
    return NextResponse.json(
      { error: "options_per_question must be between 2 and 6" },
      { status: 400 },
    );
  }

  const audienceStr = audience?.length ? audience.join("、") : "一般大众";
  const toneStr = tone?.length ? tone.join("、") : "中性";
  const hookStr = hook ?? "";
  const typeStr = quiz_type ?? "personality";

  const a = abstractness ?? 50;
  const s = seriousness ?? 50;
  const d = depth ?? 50;
  const p = poeticness ?? 50;
  const tr = title_relevance ?? 40;
  const g = goofiness ?? 50;

  if (process.env.NODE_ENV === "development") {
    const debugControls = {
      abstractness:  { value: a,  strategy: resolveStyleStrategy("abstractness", a).label },
      seriousness:   { value: s,  strategy: resolveStyleStrategy("seriousness", s).label },
      goofiness:     { value: g,  strategy: resolveStyleStrategy("goofiness", g).label },
      depth:         { value: d,  strategy: resolveStyleStrategy("depth", d).label },
      poeticness:    { value: p,  strategy: resolveStyleStrategy("poeticness", p).label },
      title_relevance: { value: tr, strategy: resolveStyleStrategy("title_relevance", tr).label },
      question_count: qc,
      options_per_question: opq,
    };
    console.log("[Quiz Questions Style Controls]", debugControls);
  }

  const resultsText = results
    .map(
      (r) =>
        `- ${r.name}（${r.key}）：${r.description} 特质：[${(r.traits ?? []).join("、")}]`,
    )
    .join("\n");

  const factorsText = factors
    .map((f) => `- ${f.key}（${f.name}）：${f.description ?? ""}`)
    .join("\n");

  // Summarize result vectors as reference
  let vectorsText = "无";
  if (result_vectors) {
    const lines: string[] = [];
    for (const [rk, vals] of Object.entries(result_vectors)) {
      const r = results.find((r) => r.key === rk);
      const name = r?.name ?? rk;
      const highlights = Object.entries(vals)
        .filter(([, v]) => v >= 80)
        .map(([k]) => k)
        .join("、");
      const lows = Object.entries(vals)
        .filter(([, v]) => v <= 30)
        .map(([k]) => k)
        .join("、");
      lines.push(
        `- ${name}（${rk}）：高=[${highlights || "无"}] 低=[${lows || "无"}]`,
      );
    }
    vectorsText = lines.join("\n") || "无";
  }

  const factorKeys = factors.map((f) => f.key);

  const userMessage = buildQuizQuestionsPrompt({
    title,
    hook: hookStr,
    quiz_type: typeStr,
    audienceStr,
    toneStr,
    abstractness: a,
    seriousness: s,
    depth: d,
    poeticness: p,
    title_relevance: tr,
    goofiness: g,
    resultsText,
    factorsText,
    resultVectorsText: vectorsText,
    factorKeys,
    question_count: qc,
    options_per_question: opq,
    existing_questions,
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
          { role: "system", content: QUIZ_QUESTIONS_SYSTEM },
          { role: "user", content: userMessage },
        ],
        temperature: 0.85,
        max_tokens: 8192,
      }),
    });

    if (!dsResponse.ok) {
      const errText = await dsResponse.text().catch(() => "");
      console.error("[quiz-ai:questions] DeepSeek API error", dsResponse.status, errText);
      trackAIError({
        client: supabase,
        userId,
        feature: "quiz_generate_questions",
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
      console.error("[quiz-ai:questions] Empty response", dsData);
      trackAIError({
        client: supabase,
        userId,
        feature: "quiz_generate_questions",
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

    let parsed: { questions?: unknown[] };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("[quiz-ai:questions] Failed to parse JSON", jsonStr.slice(0, 500));
      trackAIError({
        client: supabase,
        userId,
        feature: "quiz_generate_questions",
        model: MODEL,
        ...extractTokens(dsData),
        errorMessage: "AI returned invalid JSON",
      });
      return NextResponse.json(
        { error: "AI returned invalid JSON" },
        { status: 502 },
      );
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return NextResponse.json(
        { error: "AI response missing questions array" },
        { status: 502 },
      );
    }

    // ---- Merge pinned questions: preserve original non-empty fields ----
    let questions = parsed.questions as Record<string, unknown>[];

    // Build map of original text → ExistingQuestion for pinned items
    const pinnedByText = new Map<string, ExistingQuestion>();
    if (existing_questions) {
      for (const eq of existing_questions) {
        if (eq.is_pinned && eq.text && eq.text.trim()) {
          pinnedByText.set(eq.text.trim(), eq);
        }
      }
    }

    if (pinnedByText.size > 0) {
      questions = questions.map((aiQ) => {
        const aiText = (aiQ.text as string)?.trim();
        const original = aiText ? pinnedByText.get(aiText) : undefined;
        if (original) {
          return mergePinnedQuestion(original, aiQ);
        }
        return aiQ;
      });

      // Ensure all pinned questions are present
      for (const [text, original] of pinnedByText) {
        if (!questions.some((q) => (q.text as string)?.trim() === text)) {
          console.warn(`[quiz-ai:questions] pinned question "${text.slice(0, 30)}..." missing from AI output, adding back`);
          questions.push({
            text: original.text ?? "",
            description: original.description ?? "",
            options: (original.options ?? []).map((o) => ({
              label: o.label ?? "A",
              text: o.text ?? "",
              factor_effects: o.factor_effects ?? {},
            })),
          });
        }
      }
    }

    const factorKeySet = new Set(factorKeys);

    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      if (!q || typeof q !== "object") {
        return NextResponse.json(
          { error: `Question ${qi} is not an object` },
          { status: 502 },
        );
      }
      const qObj = q as Record<string, unknown>;
      if (!qObj.text || typeof qObj.text !== "string") {
        return NextResponse.json(
          { error: `Question ${qi} missing valid text` },
          { status: 502 },
        );
      }
      if (!Array.isArray(qObj.options)) {
        return NextResponse.json(
          { error: `Question ${qi} missing options array` },
          { status: 502 },
        );
      }

      for (let oi = 0; oi < (qObj.options as unknown[]).length; oi++) {
        const opt = (qObj.options as unknown[])[oi];
        if (!opt || typeof opt !== "object") {
          return NextResponse.json(
            { error: `Question ${qi} option ${oi} is not an object` },
            { status: 502 },
          );
        }
        const oObj = opt as Record<string, unknown>;
        if (!oObj.label || typeof oObj.label !== "string") {
          return NextResponse.json(
            { error: `Question ${qi} option ${oi} missing valid label` },
            { status: 502 },
          );
        }
        if (!oObj.text || typeof oObj.text !== "string") {
          return NextResponse.json(
            { error: `Question ${qi} option ${oi} missing valid text` },
            { status: 502 },
          );
        }
        if (!oObj.factor_effects || typeof oObj.factor_effects !== "object") {
          return NextResponse.json(
            { error: `Question ${qi} option ${oi} missing valid factor_effects` },
            { status: 502 },
          );
        }

        const effects = oObj.factor_effects as Record<string, unknown>;
        let effectCount = 0;

        for (const [key, val] of Object.entries(effects)) {
          if (!factorKeySet.has(key)) {
            return NextResponse.json(
              { error: `Question ${qi} option ${oi} uses unknown factor key "${key}"` },
              { status: 502 },
            );
          }
          if (typeof val !== "number" || val < -3 || val > 3 || !Number.isInteger(val)) {
            return NextResponse.json(
              { error: `Question ${qi} option ${oi} has invalid effect value for "${key}": ${val}` },
              { status: 502 },
            );
          }
          effectCount++;
        }

        if (effectCount === 0) {
          return NextResponse.json(
            { error: `Question ${qi} option ${oi} has no factor_effects` },
            { status: 502 },
          );
        }
        if (effectCount > 3) {
          return NextResponse.json(
            { error: `Question ${qi} option ${oi} has more than 3 factor_effects` },
            { status: 502 },
          );
        }
      }
    }

    let creditsRemaining: number | null = null;
    try {
      creditsRemaining = await spendCredit(user.id);
    } catch (err) {
      console.error("[quiz-ai:questions] spendCredit failed:", err);
    }

    trackAISuccess({
        client: supabase,
        userId,
      feature: "quiz_generate_questions",
      model: MODEL,
      ...extractTokens(dsData),
      metadata: { question_count: questions.length },
    });

    return NextResponse.json({
      questions,
      credits_remaining: creditsRemaining,
    });
  } catch (err) {
    console.error("[quiz-ai:questions] Unexpected error", err);
    trackAIError({
        client: supabase,
        userId,
      feature: "quiz_generate_questions",
      model: MODEL,
      errorMessage: err instanceof Error ? err.message : "Internal server error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
