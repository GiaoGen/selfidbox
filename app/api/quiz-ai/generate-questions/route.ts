import { NextRequest, NextResponse } from "next/server";
import { trackAISuccess, trackAIError, extractTokens } from "@/lib/ai/track-ai-usage";
import {
  QUIZ_QUESTIONS_SYSTEM,
  buildQuizQuestionsPrompt,
} from "@/lib/prompts/quiz-questions";

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
    abstractness?: number;
    seriousness?: number;
    depth?: number;
    poeticness?: number;
    results?: { key: string; name: string; description: string; traits: string[] }[];
    factors?: { key: string; name: string; description?: string }[];
    result_vectors?: Record<string, Record<string, number>>;
    question_count?: number;
    options_per_question?: number;
    pinned_questions?: { text: string }[];
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
    results,
    factors,
    result_vectors,
    question_count = 8,
    options_per_question = 4,
    pinned_questions,
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

  const labels = Array.from({ length: opq }, (_, i) =>
    String.fromCharCode(65 + i),
  ).join("/");

  const factorKeys = factors.map((f) => f.key);

  let pinnedSection = "";
  if (pinned_questions && pinned_questions.length > 0) {
    pinnedSection = `\n以下题目已经被用户固定，千万不要生成场景或主题高度相似的题目：\n${pinned_questions
      .map((p) => `- "${p.text}"`)
      .join("\n")}\n`;
  }

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
    resultsText,
    factorsText,
    resultVectorsText: vectorsText,
    factorKeys,
    question_count: qc,
    options_per_question: opq,
    pinned_questions,
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

    const factorKeySet = new Set(factorKeys);

    for (let qi = 0; qi < parsed.questions.length; qi++) {
      const q = parsed.questions[qi];
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

    trackAISuccess({
      userId,
      feature: "quiz_generate_questions",
      model: MODEL,
      ...extractTokens(dsData),
      metadata: { question_count: parsed.questions.length },
    });

    return NextResponse.json({ questions: parsed.questions });
  } catch (err) {
    console.error("[quiz-ai:questions] Unexpected error", err);
    trackAIError({
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
