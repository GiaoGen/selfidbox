import { calculateDistance } from "./quiz-vector";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

export const MAX_SANDBOX_ATTEMPTS = 20;

/* ------------------------------------------------------------------ */
/*  Runtime types (Supabase data shapes)                               */
/* ------------------------------------------------------------------ */

export interface QuizFactorData {
  key: string;
  name: string;
}

export interface QuizResultData {
  id: string;
  key: string;
  name: string;
  subtitle: string | null;
  description: string;
  traits: string[];
  result_vector: Record<string, number>;
  image_url: string | null;
  share_text: string | null;
  color: string | null;
}

export interface QuizOptionData {
  id: string;
  label: string;
  text: string;
  factor_effects: Record<string, number>;
}

export interface QuizQuestionData {
  id: string;
  text: string;
  question_order: number;
  options: QuizOptionData[];
}

export interface QuizRuntimeData {
  id: string;
  slug: string;
  title: string;
  hook: string;
  quiz_type: string;
  status: string;
  attempt_count: number;
  factors: QuizFactorData[];
  results: QuizResultData[];
  questions: QuizQuestionData[];
}

export interface AnswerRecord {
  questionId: string;
  optionId: string;
  effects: Record<string, number>;
}

export interface RankedRuntimeResult {
  result: QuizResultData;
  similarity: number;
  distance: number;
}

/* ------------------------------------------------------------------ */
/*  Vector calculation                                                 */
/* ------------------------------------------------------------------ */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateUserVector(
  factorKeys: string[],
  answers: AnswerRecord[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const key of factorKeys) {
    totals[key] = 0;
  }

  for (const answer of answers) {
    for (const [key, effect] of Object.entries(answer.effects)) {
      if (totals[key] !== undefined) {
        totals[key] += effect;
      }
    }
  }

  const vector: Record<string, number> = {};
  for (const key of factorKeys) {
    vector[key] = clamp(50 + totals[key] * 10, 0, 100);
  }
  return vector;
}

/* ------------------------------------------------------------------ */
/*  Result ranking                                                     */
/* ------------------------------------------------------------------ */

const MAX_DISTANCE_5 = Math.sqrt(5 * 100 * 100);

export function rankRuntimeResults(
  userVector: Record<string, number>,
  results: QuizResultData[],
): RankedRuntimeResult[] {
  const numFactors = Object.keys(userVector).length || 5;
  const maxDistance = Math.sqrt(numFactors * 100 * 100);

  const ranked = results.map((r) => {
    const distance = calculateDistance(userVector, r.result_vector);
    const similarity = Math.round(
      Math.max(0, (1 - distance / maxDistance)) * 100,
    );
    return { result: r, similarity, distance: Math.round(distance * 100) / 100 };
  });

  ranked.sort((a, b) => b.similarity - a.similarity);
  return ranked;
}
