import { supabase } from "./supabase";
import { DEV_USER_ID } from "./dev-user";
import type {
  QuizMeta,
  Result,
  Factor,
  ResultVector,
  Question,
} from "./mock-quiz-engine";
import type {
  QuizRuntimeData,
  QuizFactorData,
  QuizResultData,
  QuizQuestionData,
  QuizOptionData,
  AnswerRecord,
  RankedRuntimeResult,
} from "./quiz-runtime";

/* ------------------------------------------------------------------ */
/*  Read: get full quiz by slug                                        */
/* ------------------------------------------------------------------ */

export async function getQuizBySlug(slug: string): Promise<QuizRuntimeData | null> {
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id, slug, title, hook, quiz_type, status, attempt_count")
    .eq("slug", slug)
    .single();

  if (quizError || !quiz) return null;

  // Only sandbox and published quizzes are publicly accessible
  if (quiz.status !== "sandbox" && quiz.status !== "published") {
    return null;
  }

  const [
    { data: factorRows },
    { data: resultRows },
    { data: questionRows },
  ] = await Promise.all([
    supabase
      .from("quiz_factors")
      .select("key, name")
      .eq("quiz_id", quiz.id)
      .order("sort_order"),
    supabase
      .from("quiz_results")
      .select("id, key, name, subtitle, description, traits, result_vector, image_url, share_text")
      .eq("quiz_id", quiz.id)
      .order("sort_order"),
    supabase
      .from("quiz_questions")
      .select("id, text, question_order")
      .eq("quiz_id", quiz.id)
      .order("question_order"),
  ]);

  const questions: QuizQuestionData[] = [];

  if (questionRows) {
    const optionResults = await Promise.all(
      questionRows.map((q) =>
        supabase
          .from("quiz_options")
          .select("id, label, text, factor_effects")
          .eq("question_id", q.id)
          .order("option_order"),
      ),
    );

    for (let i = 0; i < questionRows.length; i++) {
      const q = questionRows[i];
      const opts: QuizOptionData[] = (optionResults[i]?.data ?? []).map(
        (o: Record<string, unknown>) => ({
          id: o.id as string,
          label: o.label as string,
          text: o.text as string,
          factor_effects: (o.factor_effects as Record<string, number>) ?? {},
        }),
      );

      questions.push({
        id: q.id,
        text: q.text,
        question_order: q.question_order,
        options: opts,
      });
    }
  }

  return {
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    hook: quiz.hook,
    quiz_type: quiz.quiz_type,
    status: quiz.status,
    attempt_count: quiz.attempt_count ?? 0,
    factors: (factorRows ?? []) as QuizFactorData[],
    results: (resultRows ?? []) as QuizResultData[],
    questions,
  };
}

/* ------------------------------------------------------------------ */
/*  Write: save quiz attempt                                           */
/* ------------------------------------------------------------------ */

export interface SaveAttemptInput {
  quizId: string;
  userVector: Record<string, number>;
  ranking: RankedRuntimeResult[];
  answers: AnswerRecord[];
}

export async function saveQuizAttempt(input: SaveAttemptInput) {
  const top = input.ranking[0];

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: input.quizId,
      user_id: DEV_USER_ID,
      user_vector: input.userVector,
      similarity_ranking: input.ranking.slice(0, 3).map((r) => ({
        result_key: r.result.key,
        result_name: r.result.name,
        similarity: r.similarity,
      })),
      final_result_id: top?.result.id ?? null,
      final_result_key: top?.result.key ?? null,
      final_result_name: top?.result.name ?? null,
      included_in_profile: true,
      profile_weight: 0.3,
    })
    .select("id")
    .single();

  if (attemptError) {
    throw new Error(`保存答题记录失败：${attemptError.message}`);
  }

  const answerRows = input.answers.map((a) => ({
    attempt_id: attempt.id,
    quiz_id: input.quizId,
    question_id: a.questionId,
    option_id: a.optionId,
  }));

  const { error: answerError } = await supabase
    .from("quiz_attempt_answers")
    .insert(answerRows);

  if (answerError) {
    // best-effort: don't rollback attempt, just log
    console.error("保存答题选项失败：", answerError.message);
  }

  return { attemptId: attempt.id };
}

/* ------------------------------------------------------------------ */
/*  Write: save full quiz schema (Quiz Studio)                         */
/* ------------------------------------------------------------------ */

export interface SaveQuizInput {
  meta: QuizMeta;
  results: Result[];
  factors: Factor[];
  resultVectors: ResultVector[];
  questions: Question[];
}

export interface SaveQuizResult {
  slug: string;
  quizId: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export async function saveQuizSchema(
  input: SaveQuizInput,
  creatorUserId: string,
): Promise<SaveQuizResult> {
  const slug = slugify(input.meta.title);

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      slug,
      title: input.meta.title,
      hook: input.meta.hook,
      quiz_type: input.meta.quiz_type,
      audience: input.meta.audience,
      tone: input.meta.tone,
      creator_user_id: creatorUserId,
    })
    .select("id")
    .single();

  if (quizError) {
    if (quizError.code === "23505") {
      throw new Error("这个测试 slug 已经存在，请换一个标题或 slug。");
    }
    throw new Error(quizError.message);
  }

  const quizId = quiz.id;

  async function rollback() {
    await supabase.from("quizzes").delete().eq("id", quizId);
  }

  const factorRows = input.factors.map((f, i) => ({
    quiz_id: quizId,
    key: f.id,
    name: f.name,
    description: f.nameEn ?? null,
    sort_order: i,
  }));

  const { error: factorError } = await supabase
    .from("quiz_factors")
    .insert(factorRows);
  if (factorError) {
    await rollback();
    throw new Error(`保存因子失败：${factorError.message}`);
  }

  const resultRows = input.results.map((r, i) => {
    const vector = input.resultVectors.find((rv) => rv.resultId === r.id);
    return {
      quiz_id: quizId,
      key: r.id,
      name: r.name,
      subtitle: r.subtitle ?? null,
      description: r.description,
      traits: r.traits,
      result_vector: vector?.values ?? {},
      share_text: r.shareText ?? null,
      image_url: r.image_url ?? null,
      sort_order: i,
    };
  });

  const { error: resultError } = await supabase
    .from("quiz_results")
    .insert(resultRows);
  if (resultError) {
    await rollback();
    throw new Error(`保存结果失败：${resultError.message}`);
  }

  for (const [qi, q] of input.questions.entries()) {
    const { data: questionRow, error: questionError } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        question_order: qi,
        text: q.text,
        description: null,
      })
      .select("id")
      .single();

    if (questionError) {
      await rollback();
      throw new Error(`保存题目失败：${questionError.message}`);
    }

    const optionRows = q.options.map((opt, oi) => ({
      question_id: questionRow.id,
      quiz_id: quizId,
      option_order: oi,
      label: opt.label,
      text: opt.text,
      factor_effects: opt.effects,
    }));

    const { error: optionError } = await supabase
      .from("quiz_options")
      .insert(optionRows);
    if (optionError) {
      await rollback();
      throw new Error(`保存选项失败：${optionError.message}`);
    }
  }

  return { slug, quizId };
}

/* ------------------------------------------------------------------ */
/*  Read: quizzes by creator                                           */
/* ------------------------------------------------------------------ */

export interface CreatorQuizRow {
  id: string;
  slug: string;
  title: string;
  hook: string;
  status: string;
  attempt_count: number;
  created_at: string;
}

export async function getQuizzesByCreator(
  userId: string,
): Promise<CreatorQuizRow[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, slug, title, hook, status, attempt_count, created_at")
    .eq("creator_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getQuizzesByCreator error:", error);
    return [];
  }

  return (data ?? []) as CreatorQuizRow[];
}

/* ------------------------------------------------------------------ */
/*  Read: get full quiz for editing (Quiz Studio)                      */
/* ------------------------------------------------------------------ */

export async function getQuizForEdit(
  quizId: string,
  userId: string,
): Promise<SaveQuizInput | null> {
  // 1. Quiz meta
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("title, hook, quiz_type, audience, tone, creator_user_id")
    .eq("id", quizId)
    .single();

  if (quizError || !quiz) return null;
  if (quiz.creator_user_id !== userId) return null;

  // 2. Results
  const { data: resultRows } = await supabase
    .from("quiz_results")
    .select("key, name, subtitle, description, traits, share_text, image_url, result_vector")
    .eq("quiz_id", quizId)
    .order("sort_order");

  // 3. Factors
  const { data: factorRows } = await supabase
    .from("quiz_factors")
    .select("key, name, description")
    .eq("quiz_id", quizId)
    .order("sort_order");

  // 4. Questions + options
  const { data: questionRows } = await supabase
    .from("quiz_questions")
    .select("id, text, question_order")
    .eq("quiz_id", quizId)
    .order("question_order");

  const questions: Question[] = [];

  if (questionRows) {
    for (const q of questionRows) {
      const { data: optionRows } = await supabase
        .from("quiz_options")
        .select("label, text, factor_effects")
        .eq("question_id", q.id)
        .order("option_order");

      questions.push({
        id: q.id,
        text: q.text,
        isPinned: false,
        options: (optionRows ?? []).map((o: Record<string, unknown>) => ({
          label: o.label as string,
          text: o.text as string,
          effects: (o.factor_effects as Record<string, number>) ?? {},
        })),
      });
    }
  }

  return {
    meta: {
      title: quiz.title,
      hook: quiz.hook,
      quiz_type: quiz.quiz_type,
      audience: quiz.audience ?? "",
      tone: quiz.tone ?? "",
    },
    results: (resultRows ?? []).map((r: Record<string, unknown>) => ({
      id: r.key as string,
      name: r.name as string,
      subtitle: (r.subtitle as string) ?? undefined,
      description: (r.description as string) ?? "",
      traits: (r.traits as string[]) ?? [],
      shareText: (r.share_text as string) ?? undefined,
      isPinned: false,
      image_url: (r.image_url as string) ?? undefined,
    })),
    factors: (factorRows ?? []).map((f: Record<string, unknown>) => ({
      id: f.key as string,
      name: f.name as string,
      nameEn: (f.description as string) ?? "",
      isPinned: false,
    })),
    resultVectors: (resultRows ?? []).map((r: Record<string, unknown>) => ({
      resultId: r.key as string,
      values: (r.result_vector as Record<string, number>) ?? {},
      isPinned: false,
    })),
    questions,
  };
}

/* ------------------------------------------------------------------ */
/*  Write: update existing quiz schema (Quiz Studio edit)               */
/* ------------------------------------------------------------------ */

export async function updateQuizSchema(
  input: SaveQuizInput,
  quizId: string,
): Promise<SaveQuizResult> {
  const slug = slugify(input.meta.title);

  // 1. Update quizzes row
  const { error: updateError } = await supabase
    .from("quizzes")
    .update({
      slug,
      title: input.meta.title,
      hook: input.meta.hook,
      quiz_type: input.meta.quiz_type,
      audience: input.meta.audience,
      tone: input.meta.tone,
    })
    .eq("id", quizId);

  if (updateError) {
    if (updateError.code === "23505") {
      throw new Error("这个测试 slug 已经存在，请换一个标题或 slug。");
    }
    throw new Error(updateError.message);
  }

  // 2. Delete old sub-rows
  await Promise.all([
    supabase.from("quiz_options").delete().eq("quiz_id", quizId),
    supabase.from("quiz_questions").delete().eq("quiz_id", quizId),
    supabase.from("quiz_results").delete().eq("quiz_id", quizId),
    supabase.from("quiz_factors").delete().eq("quiz_id", quizId),
  ]);

  // 3. Re-insert factors
  const factorRows = input.factors.map((f, i) => ({
    quiz_id: quizId,
    key: f.id,
    name: f.name,
    description: f.nameEn ?? null,
    sort_order: i,
  }));

  const { error: factorError } = await supabase
    .from("quiz_factors")
    .insert(factorRows);
  if (factorError) {
    throw new Error(`更新因子失败：${factorError.message}`);
  }

  // 4. Re-insert results
  const resultRows = input.results.map((r, i) => {
    const vector = input.resultVectors.find((rv) => rv.resultId === r.id);
    return {
      quiz_id: quizId,
      key: r.id,
      name: r.name,
      subtitle: r.subtitle ?? null,
      description: r.description,
      traits: r.traits,
      result_vector: vector?.values ?? {},
      share_text: r.shareText ?? null,
      image_url: r.image_url ?? null,
      sort_order: i,
    };
  });

  const { error: resultError } = await supabase
    .from("quiz_results")
    .insert(resultRows);
  if (resultError) {
    throw new Error(`更新结果失败：${resultError.message}`);
  }

  // 5. Re-insert questions + options
  for (const [qi, q] of input.questions.entries()) {
    const { data: questionRow, error: questionError } = await supabase
      .from("quiz_questions")
      .insert({
        quiz_id: quizId,
        question_order: qi,
        text: q.text,
        description: null,
      })
      .select("id")
      .single();

    if (questionError) {
      throw new Error(`更新题目失败：${questionError.message}`);
    }

    const optionRows = q.options.map((opt, oi) => ({
      question_id: questionRow.id,
      quiz_id: quizId,
      option_order: oi,
      label: opt.label,
      text: opt.text,
      factor_effects: opt.effects,
    }));

    const { error: optionError } = await supabase
      .from("quiz_options")
      .insert(optionRows);
    if (optionError) {
      throw new Error(`更新选项失败：${optionError.message}`);
    }
  }

  return { slug, quizId };
}
