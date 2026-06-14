/* ------------------------------------------------------------------ */
/*  Prompt builder: generate quiz questions                             */
/* ------------------------------------------------------------------ */

export const QUIZ_QUESTIONS_SYSTEM = `You are a quiz question designer for a vector-space personality quiz. Output ONLY valid JSON — no markdown, no explanation.

HOW IT WORKS:
Each option has "factor_effects" — integer deltas (-3 to +3) shifting the user's position on personality dimensions. After answering, accumulated values form a user vector, matched to pre-defined result vectors by Euclidean distance.

QUESTION RULES:

1. RESULTS-DRIVEN: Every question MUST help distinguish between the provided results. Study their names, traits, and descriptions. Design questions that probe DIFFERENCES — if a question doesn't separate at least 2 results, it's useless.

2. THEME-BINDING (controlled by title_relevance in the user message):
- HIGH title_relevance (70-100): Questions must be tightly bound to the quiz theme/title. Every question and option should clearly reference the theme. Use theme-specific scenarios, vocabulary, and imagery.
- MEDIUM title_relevance (31-69): A mix — some questions connect to the quiz theme, others probe personality through general life choices, emotional reactions, and value judgments.
- LOW title_relevance (0-30): Questions should feel NATURAL and life-based. Use everyday situations, emotional choices, relationship patterns, and value judgments to indirectly reveal the result personality. The quiz theme provides only a light creative flavor — do NOT force theme keywords into every question. Let the theme emerge indirectly through the type of person each result describes.

3. ANTI-TEMPLATE — Avoid scenarios that could appear in ANY personality quiz regardless of theme (weekend plans, party behavior, travel packing, lottery winnings, comforting a friend). Instead: generate questions that make sense for THIS specific quiz, given its theme and style parameters.

4. OPTION SEMANTICS — factor_effects MUST follow from option meaning, not random:
- "自己解决" → +independence, -attachment
- "寻求建议" → -independence, +attachment
- Each effect must have clear semantic justification.
- Each option affects 1-3 factors. Values: integers -3 to +3.

5. QUESTION DIVERSITY:
- No two questions probing the same situation or factor combination.
- Each question covers DIFFERENT factors.
- ALL factors must be covered across the question set.

6. STYLE PARAMETERS — The user message provides 6 style values (0-100) with EXPLICIT STRATEGY instructions for each. These strategies are MANDATORY — they define HOW to write, not just what to write about. A question set at opposite ends of a parameter must feel like a COMPLETELY different quiz. The strategy instructions in the user message take precedence over any default assumptions.

7. GENERATE exactly the requested question_count, each with the requested options_per_question.

8. EXISTING QUESTIONS (partial-fill mode):
You may receive existing questions with some fields already filled. Each has an "is_pinned" flag.
- PINNED (is_pinned=true): KEEP all non-empty fields as-is. ONLY fill in fields that are empty/null/missing. For options: if an option has text, keep it and only generate its factor_effects. If the question text is non-empty, NEVER change it.
- UNPINNED (is_pinned=false): you may regenerate freely.
- The final output MUST include ALL questions — both pinned (with empty fields filled) and newly generated ones — totaling exactly question_count.

OUTPUT:
{"questions":[{"text":"...","description":"","options":[{"label":"A","text":"...","factor_effects":{"factor_key":2,"another_factor":-1}}]}]}
- Labels: sequential uppercase A, B, C, D...
- All text in Chinese except factor keys (English snake_case).`;

/* ------------------------------------------------------------------ */
/*  Strategy helpers: map numeric values to behavioral instructions    */
/* ------------------------------------------------------------------ */

type StyleControl = "abstractness" | "seriousness" | "goofiness" | "depth" | "poeticness" | "title_relevance";

interface StyleStrategy {
  label: string;
  instruction: string;
}

function band(v: number): "very_low" | "low" | "mid" | "high" | "very_high" {
  if (v <= 20) return "very_low";
  if (v <= 40) return "low";
  if (v <= 60) return "mid";
  if (v <= 80) return "high";
  return "very_high";
}

const STRATEGIES: Record<StyleControl, Record<string, StyleStrategy>> = {
  abstractness: {
    very_low:  { label: "VERY CONCRETE",  instruction: "Use ONLY concrete, everyday situations. Specific places, objects, people, routines. No metaphors, no abstract concepts. Example: \"周末你更愿意去哪里？\" not \"如果时间是一种颜色，你会选择？\"" },
    low:       { label: "CONCRETE",       instruction: "Mostly concrete situations with occasional light metaphor. Questions grounded in daily life." },
    mid:       { label: "BALANCED",       instruction: "Mix of concrete situations and abstract framing. Some everyday, some conceptual." },
    high:      { label: "ABSTRACT",       instruction: "Mostly metaphorical, imaginative, dream-like scenarios. Abstract concepts, symbolic choices, hypothetical worlds." },
    very_high: { label: "VERY ABSTRACT",  instruction: "Generate PURELY abstract, metaphorical questions. Dream logic, synesthesia, symbolic landscapes. Replace ALL concrete situations with conceptual alternatives. Example: \"如果你的记忆是一种天气，它更接近？\" A reader should NOT encounter a single mundane daily-life scenario." },
  },
  seriousness: {
    very_low:  { label: "VERY CASUAL",    instruction: "Like a BuzzFeed quiz or party game. Use slang, emoji-worthy phrasing, relatable everyday humor. The quiz should feel FUN and light. Questions can be playful and unpretentious." },
    low:       { label: "CASUAL",         instruction: "Relaxed, friendly tone. Light humor is welcome. Feels like a conversation with a witty friend." },
    mid:       { label: "BALANCED",       instruction: "Neither stiff nor silly. Clear, approachable but not frivolous." },
    high:      { label: "SERIOUS",        instruction: "Formal, restrained, dignified. Like a quality magazine personality assessment. Minimal humor, precise language." },
    very_high: { label: "VERY SERIOUS",   instruction: "Clinical and formal, like a real psychological assessment or academic survey instrument. NO jokes. NO slang. NO casual language. Use precise, measured wording throughout." },
  },
  goofiness: {
    very_low:  { label: "NORMAL",         instruction: "Standard quiz question style. Straightforward, reasonable scenarios and options." },
    low:       { label: "MILDLY PLAYFUL", instruction: "Occasional witty or clever twists, but mostly conventional. A light touch of personality." },
    mid:       { label: "PLAYFUL",        instruction: "Noticeably playful. Options can include clever subversions, mild absurdity, internet-native humor. Still grounded in real personality measurement." },
    high:      { label: "VERY PLAYFUL",   instruction: "Absurd premises, unexpected twists, anti-trope humor. Options SHOULD include deliberately ridiculous but ideologically meaningful choices. The quiz should feel surprising and fun. IMPORTANT: absurdity is the DELIVERY, not the content — questions must still distinguish factors and produce real results." },
    very_high: { label: "MAXIMUM GOOFY",  instruction: "Go ALL OUT on absurdity and anti-trope humor. Every question should subvert expectations. Options can be wildly creative, internet-poisoned, surreal. Readers should laugh out loud. BUT: every option's factor_effects must still be semantically justified — the absurdity is in the SCENARIO, not in the measurement logic. The quiz must still WORK as a personality test." },
  },
  depth: {
    very_low:  { label: "SURFACE",        instruction: "Pure preferences, daily habits, aesthetic choices. \"你更喜欢猫还是狗？\" Simple likes/dislikes. No introspection required." },
    low:       { label: "SHALLOW",        instruction: "Mostly surface-level preferences and habits. Occasional light introspection. Easy to answer quickly." },
    mid:       { label: "BALANCED",       instruction: "Mix of surface preferences and introspective questions. Some habit-based, some value-based." },
    high:      { label: "DEEP",           instruction: "Focus on inner values, moral dilemmas, relationship dynamics, identity questions. Most questions require genuine self-reflection." },
    very_high: { label: "VERY DEEP",      instruction: "Existential, philosophical, emotionally probing. Questions about identity, meaning, regret, transformation, core values. \"你如何面对生命中无法挽回的遗憾？\" Every question should provoke genuine introspection. No surface-level preference questions." },
  },
  poeticness: {
    very_low:  { label: "DIRECT",         instruction: "Plain, direct, conversational Chinese. Short sentences. Everyday vocabulary. \"你喜欢热闹还是安静？\"" },
    low:       { label: "PLAIN",          instruction: "Clear and direct, with occasional vivid phrasing. Unpretentious but not flat." },
    mid:       { label: "BALANCED",       instruction: "Mix of direct and evocative language. Some imagery, some plain statements." },
    high:      { label: "LYRICAL",        instruction: "Rich imagery, sensory details, literary phrasing. Questions read like poetry or literature. \"你是被喧嚣填满，还是在寂静里听见自己？\"" },
    very_high: { label: "VERY LYRICAL",   instruction: "MAXIMUM literary quality. Every question is a miniature poem. Dense imagery, rhythm, synesthesia, metaphor. Language itself is part of the quiz experience. Questions should be quotable, beautiful, memorable." },
  },
  title_relevance: {
    very_low:  { label: "INDIRECT",       instruction: "Questions feel life-based and universal, NOT theme-bound. Almost NEVER mention the quiz title or its keywords directly. The theme emerges INDIRECTLY through the personality types being measured. Readers might forget what quiz they're taking — and that's INTENTIONAL." },
    low:       { label: "LOOSE",          instruction: "Mostly indirect. Occasional subtle theme nods. Theme is a background flavor, not a foreground element." },
    mid:       { label: "BALANCED",       instruction: "Some questions tie to the theme, others probe through general life scenarios." },
    high:      { label: "TIGHT",          instruction: "Most questions are woven around the quiz theme/title. Theme-specific vocabulary, scenarios, and references throughout." },
    very_high: { label: "VERY TIGHT",     instruction: "EVERY question MUST be unmistakably about the quiz theme. Use theme-specific scenarios, jargon, imagery, and references. A reader should instantly know what quiz they're taking from any single question. Questions that could belong to a different quiz theme are INVALID." },
  },
};

export function resolveStyleStrategy(control: StyleControl, value: number): StyleStrategy {
  return STRATEGIES[control][band(value)];
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ExistingQuestion {
  text?: string;
  description?: string;
  options?: { label: string; text?: string; factor_effects?: Record<string, number> }[];
  is_pinned: boolean;
}

export interface BuildQuizQuestionsPromptInput {
  title: string;
  hook?: string;
  quiz_type?: string;
  audienceStr: string;
  toneStr: string;
  abstractness: number;
  seriousness: number;
  depth: number;
  poeticness: number;
  title_relevance: number;
  goofiness: number;
  resultsText: string;
  factorsText: string;
  resultVectorsText: string;
  factorKeys: string[];
  question_count: number;
  options_per_question: number;
  existing_questions?: ExistingQuestion[];
}

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                     */
/* ------------------------------------------------------------------ */

export function buildQuizQuestionsPrompt(
  input: BuildQuizQuestionsPromptInput,
): string {
  const {
    title,
    hook = "",
    quiz_type = "personality",
    audienceStr,
    toneStr,
    abstractness,
    seriousness,
    depth,
    poeticness,
    title_relevance,
    goofiness,
    resultsText,
    factorsText,
    resultVectorsText,
    factorKeys,
    question_count,
    options_per_question,
    existing_questions,
  } = input;

  // Resolve all strategies
  const controls: { name: string; value: number; strategy: StyleStrategy }[] = [
    { name: "ABSTRACTNESS",    value: abstractness,    strategy: resolveStyleStrategy("abstractness", abstractness) },
    { name: "SERIOUSNESS",     value: seriousness,     strategy: resolveStyleStrategy("seriousness", seriousness) },
    { name: "GOOFINESS",       value: goofiness,       strategy: resolveStyleStrategy("goofiness", goofiness) },
    { name: "DEPTH",           value: depth,           strategy: resolveStyleStrategy("depth", depth) },
    { name: "POETICNESS",      value: poeticness,      strategy: resolveStyleStrategy("poeticness", poeticness) },
    { name: "TITLE_RELEVANCE", value: title_relevance, strategy: resolveStyleStrategy("title_relevance", title_relevance) },
  ];

  // Build strategy block
  const strategyBlock = controls
    .map(
      (c) =>
        `${c.name} = ${c.value} → STRATEGY: ${c.strategy.label}\n${c.strategy.instruction}`,
    )
    .join("\n\n");

  let existingBlock = "";
  if (existing_questions && existing_questions.length > 0) {
    const lines = existing_questions.map((q) => {
      const pin = q.is_pinned ? "🔒PINNED" : "🔓unpinned";
      const hasText = q.text && q.text.trim();
      const optionCount = q.options?.length ?? 0;
      const filledOptions = q.options?.filter((o) => o.text && o.text.trim()).length ?? 0;
      const parts: string[] = [];
      if (!hasText) parts.push("text");
      if (optionCount === 0) parts.push("options");
      if (filledOptions < optionCount && optionCount > 0) parts.push("option factor_effects");
      const emptyNote = parts.length > 0 ? ` [需补全: ${parts.join(", ")}]` : "";
      return `- ${pin} "${q.text || "(无text)"}"${emptyNote}`;
    });
    existingBlock = `\n已有题目（保留 pinned 的非空字段，只补全缺失字段；不要生成与 pinned 场景或主题相似的题目）：\n${lines.join("\n")}`;
  }

  return `标题：「${title}」${hook ? ` 副标题：「${hook}」` : ""}
类型：${quiz_type} | 受众：${audienceStr} | 语气：${toneStr}

======================================================================
STYLE STRATEGIES (MANDATORY — these define HOW to write every question):
======================================================================

${strategyBlock}

======================================================================
END STYLE STRATEGIES
======================================================================

生成：${question_count} 题 × ${options_per_question} 选项 | 覆盖 ${factorKeys.length} 个因子：${factorKeys.join(", ")}

结果人格（题目必须能区分这些结果）：
${resultsText}

因子维度：
${factorsText}

参考向量（高=该结果在此因子上的理想位置）：
${resultVectorsText}${existingBlock}`;
}
