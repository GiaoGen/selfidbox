import { randomBytes } from "crypto";
import { cache } from "react";
import { createClient as createSSRClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { keyedSingleQuery } from "./cache";
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
import type { AdminCategoryRow } from "./admin-db";

async function getDb(): Promise<SupabaseClient> {
  return createSSRClient();
}

/** Returns a service-role client that bypasses RLS.
 *  Only used for write operations where the API route
 *  has already performed its own auth check. */
function getServiceDb(): SupabaseClient {
  return createServiceClient();
}

/* ------------------------------------------------------------------ */
/*  Read: get full quiz by slug                                        */
/* ------------------------------------------------------------------ */

export const getQuizBySlug = cache(async (slug: string): Promise<QuizRuntimeData | null> => {
  const { data: quiz, error: quizError } = await (await getDb())
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
    (await getDb())
      .from("quiz_factors")
      .select("key, name")
      .eq("quiz_id", quiz.id)
      .order("sort_order"),
    (await getDb())
      .from("quiz_results")
      .select("id, key, name, subtitle, description, traits, result_vector, image_url, share_text, color")
      .eq("quiz_id", quiz.id)
      .order("sort_order"),
    (await getDb())
      .from("quiz_questions")
      .select("id, text, question_order")
      .eq("quiz_id", quiz.id)
      .order("question_order"),
  ]);

  const questions: QuizQuestionData[] = [];

  if (questionRows) {
    const optionResults = await Promise.all(
      questionRows.map(async (q) =>
        (await getDb())
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
});

/* ------------------------------------------------------------------ */
/*  Read: quiz detail (for /quizzes/[slug] detail page)                 */
/* ------------------------------------------------------------------ */

function hashSlug(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export interface QuizDetailRow {
  id: string;
  slug: string;
  title: string;
  hook: string;
  description: string | null;
  cover_image_url: string | null;
  image_url: string | null;
  category_id: string | null;
  quiz_type: string;
  status: string;
  attempt_count: number;
  featured: boolean;
  created_at: string;
  category: AdminCategoryRow | null;
}

export const getQuizDetail = keyedSingleQuery(
  "getQuizDetail",
  async (slug: string): Promise<QuizDetailRow | null> => {
  const { data, error } = await (await getDb())
    .from("quizzes")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;

  const quiz = data as QuizDetailRow;

  if (quiz.category_id) {
    const { data: cat } = await (await getDb())
      .from("test_categories")
      .select("*")
      .eq("id", quiz.category_id)
      .single();
    quiz.category = (cat as AdminCategoryRow) ?? null;
  } else {
    quiz.category = null;
  }

  // fetch result image from quiz_results (deterministic pick)
  {
    const { data: results } = await (await getDb())
      .from("quiz_results")
      .select("image_url")
      .eq("quiz_id", quiz.id)
      .not("image_url", "is", null);
    const images = (results ?? []).map((r: Record<string, unknown>) => r.image_url as string).filter(Boolean);
    quiz.image_url = images.length > 0 ? images[hashSlug(quiz.slug) % images.length] : null;
  }

  return quiz;
},
  60, // 1 min TTL
);

export interface QuizDetailRelatedRow {
  id: string;
  slug: string;
  title: string;
  hook: string;
  description: string | null;
  cover_image_url: string | null;
  image_url: string | null;
  attempt_count: number;
  created_at: string;
}

export async function getRelatedQuizzes(
  categoryId: string,
  excludeSlug: string,
): Promise<QuizDetailRelatedRow[]> {
  const { data, error } = await (await getDb())
    .from("quizzes")
    .select("id, slug, title, hook, description, cover_image_url, attempt_count, created_at")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .neq("slug", excludeSlug)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("getRelatedQuizzes error:", error);
    return [];
  }

  const quizzes = (data ?? []) as QuizDetailRelatedRow[];

  // fetch result images from quiz_results (deterministic pick per quiz)
  if (quizzes.length > 0) {
    const quizIds = quizzes.map((q) => q.id);
    const { data: results } = await (await getDb())
      .from("quiz_results")
      .select("quiz_id, image_url")
      .in("quiz_id", quizIds)
      .not("image_url", "is", null);

    const imageMap = new Map<string, string[]>();
    for (const row of (results ?? []) as { quiz_id: string; image_url: string }[]) {
      const urls = imageMap.get(row.quiz_id) || [];
      urls.push(row.image_url);
      imageMap.set(row.quiz_id, urls);
    }

    for (const q of quizzes) {
      const images = imageMap.get(q.id) || [];
      q.image_url = images.length > 0 ? images[hashSlug(q.slug) % images.length] : null;
    }
  }

  return quizzes;
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
  abstractness?: number;
  seriousness?: number;
  depth?: number;
  poeticness?: number;
}

export interface SaveQuizResult {
  slug: string;
  quizId: string;
}

const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateSlug(): string {
  const bytes = randomBytes(6);
  let slug = "q_";
  for (let i = 0; i < 6; i++) {
    slug += SLUG_CHARS[bytes[i] % SLUG_CHARS.length];
  }
  return slug;
}

/** Generate a unique slug, retrying on collision. */
async function uniqueSlug(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    const { data } = await (await getDb())
      .from("quizzes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
  }
  throw new Error("无法生成唯一 slug，请重试。");
}

export async function saveQuizSchema(
  input: SaveQuizInput,
  creatorUserId: string,
): Promise<SaveQuizResult> {
  const slug = await uniqueSlug();

  const { data: quiz, error: quizError } = await getServiceDb()
    .from("quizzes")
    .insert({
      slug,
      title: input.meta.title,
      hook: input.meta.hook,
      quiz_type: input.meta.quiz_type,
      audience: input.meta.audience,
      tone: input.meta.tone,
      creator_user_id: creatorUserId,
      abstractness: input.abstractness ?? 50,
      seriousness: input.seriousness ?? 50,
      depth: input.depth ?? 50,
      poeticness: input.poeticness ?? 50,
      description: input.meta.description ?? null,
      cover_image_url: input.meta.cover_image_url ?? null,
      category_id: input.meta.category_id ?? null,
      featured: input.meta.featured ?? false,
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
    await getServiceDb().from("quizzes").delete().eq("id", quizId);
  }

  const factorRows = input.factors.map((f, i) => ({
    quiz_id: quizId,
    key: f.id,
    name: f.name,
    description: f.nameEn ?? null,
    sort_order: i,
  }));

  const { error: factorError } = await getServiceDb()
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
      color: r.color ?? null,
      sort_order: i,
    };
  });

  const { error: resultError } = await getServiceDb()
    .from("quiz_results")
    .insert(resultRows);
  if (resultError) {
    await rollback();
    throw new Error(`保存结果失败：${resultError.message}`);
  }

  for (const [qi, q] of input.questions.entries()) {
    const { data: questionRow, error: questionError } = await getServiceDb()
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

    const { error: optionError } = await getServiceDb()
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
  const { data, error } = await (await getDb())
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
  const db = getServiceDb();

  // 1. Quiz meta
  const { data: quiz, error: quizError } = await db
    .from("quizzes")
    .select("title, hook, quiz_type, audience, tone, creator_user_id, abstractness, seriousness, depth, poeticness")
    .eq("id", quizId)
    .single();

  if (quizError || !quiz) return null;
  if (quiz.creator_user_id !== userId) return null;

  // 2. Results
  const { data: resultRows } = await db
    .from("quiz_results")
    .select("key, name, subtitle, description, traits, share_text, image_url, result_vector, color")
    .eq("quiz_id", quizId)
    .order("sort_order");

  // 3. Factors
  const { data: factorRows } = await db
    .from("quiz_factors")
    .select("key, name, description")
    .eq("quiz_id", quizId)
    .order("sort_order");

  // 4. Questions + options
  const { data: questionRows } = await db
    .from("quiz_questions")
    .select("id, text, question_order")
    .eq("quiz_id", quizId)
    .order("question_order");

  const questions: Question[] = [];

  if (questionRows) {
    for (const q of questionRows) {
      const { data: optionRows } = await db
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
    abstractness: (quiz as Record<string, unknown>).abstractness as number ?? 50,
    seriousness: (quiz as Record<string, unknown>).seriousness as number ?? 50,
    depth: (quiz as Record<string, unknown>).depth as number ?? 50,
    poeticness: (quiz as Record<string, unknown>).poeticness as number ?? 50,
    results: (resultRows ?? []).map((r: Record<string, unknown>) => ({
      id: r.key as string,
      name: r.name as string,
      subtitle: (r.subtitle as string) ?? undefined,
      description: (r.description as string) ?? "",
      traits: (r.traits as string[]) ?? [],
      shareText: (r.share_text as string) ?? undefined,
      isPinned: false,
      image_url: (r.image_url as string) ?? undefined,
      color: (r.color as string) ?? undefined,
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
  // Fetch existing slug — do NOT regenerate on edit
  const { data: existing } = await getServiceDb()
    .from("quizzes")
    .select("slug")
    .eq("id", quizId)
    .single();

  const slug = existing?.slug;
  if (!slug) throw new Error("Quiz not found");

  // 1. Update quizzes row (slug preserved)
  const { error: updateError } = await getServiceDb()
    .from("quizzes")
    .update({
      title: input.meta.title,
      hook: input.meta.hook,
      quiz_type: input.meta.quiz_type,
      audience: input.meta.audience,
      tone: input.meta.tone,
      abstractness: input.abstractness ?? 50,
      seriousness: input.seriousness ?? 50,
      depth: input.depth ?? 50,
      poeticness: input.poeticness ?? 50,
      description: input.meta.description ?? null,
      cover_image_url: input.meta.cover_image_url ?? null,
      category_id: input.meta.category_id ?? null,
      featured: input.meta.featured ?? false,
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
    getServiceDb().from("quiz_options").delete().eq("quiz_id", quizId),
    getServiceDb().from("quiz_questions").delete().eq("quiz_id", quizId),
    getServiceDb().from("quiz_results").delete().eq("quiz_id", quizId),
    getServiceDb().from("quiz_factors").delete().eq("quiz_id", quizId),
  ]);

  // 3. Re-insert factors
  const factorRows = input.factors.map((f, i) => ({
    quiz_id: quizId,
    key: f.id,
    name: f.name,
    description: f.nameEn ?? null,
    sort_order: i,
  }));

  const { error: factorError } = await getServiceDb()
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
      color: r.color ?? null,
      sort_order: i,
    };
  });

  const { error: resultError } = await getServiceDb()
    .from("quiz_results")
    .insert(resultRows);
  if (resultError) {
    throw new Error(`更新结果失败：${resultError.message}`);
  }

  // 5. Re-insert questions + options
  for (const [qi, q] of input.questions.entries()) {
    const { data: questionRow, error: questionError } = await getServiceDb()
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

    const { error: optionError } = await getServiceDb()
      .from("quiz_options")
      .insert(optionRows);
    if (optionError) {
      throw new Error(`更新选项失败：${optionError.message}`);
    }
  }

  return { slug, quizId };
}
