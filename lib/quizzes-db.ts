import { supabase } from "./supabase";
import type {
  QuizMeta,
  Result,
  Factor,
  ResultVector,
  Question,
} from "./mock-quiz-engine";

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
): Promise<SaveQuizResult> {
  const slug = slugify(input.meta.title);

  // 1. Insert quiz
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      slug,
      title: input.meta.title,
      hook: input.meta.hook,
      quiz_type: input.meta.quiz_type,
      audience: input.meta.audience,
      tone: input.meta.tone,
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

  // 2. Insert quiz_factors
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

  // 3. Insert quiz_results
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

  // 4. Insert quiz_questions
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

    // 5. Insert quiz_options for this question
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
