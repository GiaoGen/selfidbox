import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_CHAT_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are a personality quiz designer building a vector-space quiz engine.

HOW THIS WORKS:
- The quiz does NOT score points toward specific results.
- Instead, each option has "factor_effects" — small integer deltas (-3 to +3) that shift the user's position on personality dimensions.
- After answering all questions, the user's accumulated factor values form a "user vector."
- This vector is compared (Euclidean distance) to pre-defined "result vectors" to find the closest match.

QUESTION RULES:
- Scenario-based: everyday situations with vivid imagery.
- Easy to choose: no overthinking required.
- Share-friendly: questions and options feel fun and shareable.
- NOT exam-like, NOT medical, NOT clinical, NOT deeply private.
- Written in natural Chinese.
- Each question should probe different combinations of factors.

STYLE CONTROLS: You will receive 4 numeric style parameters (0-100). Adjust your output accordingly:

abstractness (0=真实/realistic, 100=抽象/abstract):
- High values: use metaphorical scenarios, imaginative situations, symbolic questions (e.g. "如果你是一颗漂浮在宇宙中的种子？").
- Low values: use concrete, everyday, realistic scenarios (e.g. "今天下班后你会做什么？").
- This affects: question text, option text.

seriousness (0=搞怪/playful, 100=严肃/serious):
- High values: use formal, thoughtful question topics; avoid humor (e.g. "你的决策风格是什么？").
- Low values: use quirky, humorous, unexpected questions (e.g. "你是哪种冰箱人格？").
- This affects: question text, option text.

depth (0=轻松/light, 100=深度/deep):
- High values: probe values, moral dilemmas, inner conflicts (e.g. "当价值观冲突时你会如何选择？").
- Low values: stay on surface preferences, light daily choices (e.g. "你喜欢猫还是狗？").
- This affects: question text, option framing.

poeticness (0=直白/direct, 100=文艺/poetic):
- High values: use lyrical, imagery-rich option text with literary quality.
- Low values: use plain, direct option text.
- This affects: option text wording.

OPTION EFFECT RULES:
- Each option must affect 1–3 factors.
- Effects are small integers from -3 to +3.
- Design options so different choices push the user vector in different directions.
- Use the reference result_vectors to understand what "directions" make sense, but do NOT mention result names in questions/options.

COVERAGE RULE:
- Every factor must be covered by at least one option across the entire question set.

PINNED QUESTIONS: Some questions may already be fixed (pinned) by the user. You will receive their text as reference. Do NOT generate questions that are highly similar in scenario or theme to pinned questions (e.g. if "你更喜欢哪种夜晚？" is pinned, do not generate "晚上你喜欢做什么？").

OUTPUT RULES:
- Output ONLY valid JSON. No markdown, no code fences, no explanation.
- Labels must be sequential uppercase letters: A, B, C, D...

Output format:
{
  "questions": [
    {
      "text": "你更喜欢哪种夜晚？",
      "description": "",
      "options": [
        {
          "label": "A",
          "text": "一个人听雨写东西",
          "factor_effects": {
            "sensitivity": 2,
            "imagination": 2,
            "expressiveness": -1
          }
        }
      ]
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

  const userMessage = `设计一套人格测试题目。

测试标题：${title}
测试副标题：${hookStr}
测试类型：${typeStr}
目标受众：${audienceStr}
语气风格：${toneStr}
题目数量：${qc} 题
每题选项：${opq} 个（标签：${labels}）

风格控制参数：
- 抽象度 = ${a}/100 ${a >= 70 ? "（多用隐喻和想象场景，减少现实场景）" : a <= 30 ? "（使用真实日常场景和直白表达）" : "（平衡真实与抽象）"}
- 严肃度 = ${s}/100 ${s >= 70 ? "（正式、分析性表达，不要搞怪）" : s <= 30 ? "（加入搞怪、娱乐化元素，轻松有趣）" : "（平衡严肃与轻松）"}
- 深度 = ${d}/100 ${d >= 70 ? "（关注价值观、内在冲突、哲学性问题）" : d <= 30 ? "（关注表面偏好、轻松话题）" : "（平衡深度与轻松）"}
- 文艺度 = ${p}/100 ${p >= 70 ? "（选项文本使用有画面感、文学感的表达）" : p <= 30 ? "（选项文本使用直白、简洁的表达）" : "（平衡文艺与直白）"}

结果人格：
${resultsText}

因子维度：
${factorsText}

各结果在高/低因子上的参考（仅作设计参考，请勿在题目中提及结果名称）：
${vectorsText}

可用的 factor_effects key：${factorKeys.join(", ")}
${pinnedSection}
要求：
- 每题各选项的 factor_effects 必须使用以上 factor keys
- 每个 option 影响 1-3 个因子
- 值在 -3 到 +3 之间
- 不同选项应推动不同方向
- 所有 ${factorKeys.length} 个因子在整个题目集中都要有涉及
- 题目要场景化、有画面感、容易选、适合分享
- 严格按照风格控制参数调整题目的抽象度、严肃度、深度和选项的文艺度${
    pinned_questions?.length ? "\n- 不要生成与上述固定题目高度相似的新题目" : ""
  }`;

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
        max_tokens: 8192,
      }),
    });

    if (!dsResponse.ok) {
      const errText = await dsResponse.text().catch(() => "");
      console.error("[quiz-ai:questions] DeepSeek API error", dsResponse.status, errText);
      return NextResponse.json(
        { error: `DeepSeek API returned ${dsResponse.status}` },
        { status: 502 },
      );
    }

    const dsData = await dsResponse.json();
    const rawContent: string = dsData?.choices?.[0]?.message?.content ?? "";

    if (!rawContent) {
      console.error("[quiz-ai:questions] Empty response", dsData);
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

    return NextResponse.json({ questions: parsed.questions });
  } catch (err) {
    console.error("[quiz-ai:questions] Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
