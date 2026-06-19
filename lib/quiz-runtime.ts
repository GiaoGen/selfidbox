import { calculateDistance } from "./quiz-vector";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

export const MAX_SANDBOX_ATTEMPTS = 20;

/** Softmax temperature for distance→probability conversion (tunable). */
export const SCORING_ALPHA = 10;

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

export interface RankedRuntimeResultV2 extends RankedRuntimeResult {
  probability: number;
  originalVector: Record<string, number>;
  projectedVector: Record<string, number>;
}

export interface FactorDebugInfo {
  low: Record<string, number>;
  high: Record<string, number>;
  reach: Record<string, number>;
}

export interface ScoringDebugInfo {
  userVector: Record<string, number>;
  factorRanges: FactorDebugInfo;
  factorWeights: Record<string, number>;
  results: Array<{
    id: string;
    distance: number;
    probability: number;
    originalVector: Record<string, number>;
    projectedVector: Record<string, number>;
  }>;
  winner: { id: string; name: string } | null;
  runnerUp: { id: string; name: string } | null;
  confidence: "low" | "medium" | "high";
  margin: number;
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
    vector[key] = clamp(50 + totals[key] * 3, 0, 100);
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

/* ================================================================== */
/*  V2 Scoring — reach-calibrated weighted distance + softmax          */
/* ================================================================== */

/** Per-factor min/max reachable vector position given all questions. */
function calculateFactorRanges(
  factorKeys: string[],
  questions: QuizQuestionData[],
): { low: Record<string, number>; high: Record<string, number>; reach: Record<string, number> } {
  const minTotal: Record<string, number> = {};
  const maxTotal: Record<string, number> = {};

  for (const key of factorKeys) {
    minTotal[key] = 0;
    maxTotal[key] = 0;
  }

  for (const q of questions) {
    for (const key of factorKeys) {
      let qMin = 0;
      let qMax = 0;
      for (const opt of q.options) {
        const eff = opt.factor_effects[key] ?? 0;
        if (eff < qMin) qMin = eff;
        if (eff > qMax) qMax = eff;
      }
      minTotal[key] += qMin;
      maxTotal[key] += qMax;
    }
  }

  const low: Record<string, number> = {};
  const high: Record<string, number> = {};
  const reach: Record<string, number> = {};

  for (const key of factorKeys) {
    low[key] = clamp(50 + minTotal[key] * 3, 0, 100);
    high[key] = clamp(50 + maxTotal[key] * 3, 0, 100);
    reach[key] = high[key] - low[key];
  }

  return { low, high, reach };
}

/** Factor weights: coverage (how much the quiz measures it) × separation (how much results differ on it). */
function calculateFactorWeights(
  factorKeys: string[],
  reach: Record<string, number>,
  results: QuizResultData[],
): Record<string, number> {
  const rawWeights: Record<string, number> = {};
  let sum = 0;

  // Per-factor std across all result vectors
  for (const key of factorKeys) {
    const values = results.map((r) => r.result_vector[key] ?? 50);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);

    const coverage = Math.min(1, reach[key] / 60);
    const separation = std / 50;
    rawWeights[key] = coverage * separation;
    sum += rawWeights[key];
  }

  const weights: Record<string, number> = {};

  if (sum < 1e-9) {
    console.warn("[ScoringV2] all factor weights ≈ 0, using uniform weights");
    for (const key of factorKeys) weights[key] = 1 / factorKeys.length;
  } else {
    for (const key of factorKeys) weights[key] = rawWeights[key] / sum;
  }

  return weights;
}

/** Numerically stable softmax. */
function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const total = exps.reduce((a, b) => a + b, 0);
  if (total < 1e-12) return scores.map(() => 1 / scores.length);
  return exps.map((e) => e / total);
}

/** Clamp a result vector to the reachable range without mutating the original. */
function projectResultVector(
  original: Record<string, number>,
  factorKeys: string[],
  low: Record<string, number>,
  high: Record<string, number>,
): Record<string, number> {
  const projected: Record<string, number> = {};
  for (const key of factorKeys) {
    projected[key] = clamp(original[key] ?? 50, low[key], high[key]);
  }
  return projected;
}

export function rankRuntimeResultsV2(
  userVector: Record<string, number>,
  results: QuizResultData[],
  questions: QuizQuestionData[],
  factorKeys: string[],
  alpha: number = SCORING_ALPHA,
): { ranked: RankedRuntimeResultV2[]; debug: ScoringDebugInfo } {
  if (results.length === 0) {
    return {
      ranked: [],
      debug: {
        userVector,
        factorRanges: { low: {}, high: {}, reach: {} },
        factorWeights: {},
        results: [],
        winner: null,
        runnerUp: null,
        confidence: "high",
        margin: 0,
      },
    };
  }

  /* ---- 1. Reachable ranges per factor ---- */
  const { low, high, reach } = calculateFactorRanges(factorKeys, questions);

  /* ---- 2. Factor weights ---- */
  const weights = calculateFactorWeights(factorKeys, reach, results);

  /* ---- 3. Active factors (reach ≥ 5) ---- */
  const activeKeys = factorKeys.filter((k) => reach[k] >= 5);

  /* ---- 4. Project result vectors ---- */
  const projectedResults = results.map((r) => ({
    result: r,
    projected: projectResultVector(r.result_vector, factorKeys, low, high),
  }));

  /* ---- 5. Weighted normalised distance ---- */
  const withDistances = projectedResults.map(({ result, projected }) => {
    let sum = 0;
    for (const key of activeKeys) {
      if (reach[key] < 1e-9) continue;
      const w = weights[key] ?? 0;
      const uNorm = (userVector[key] - low[key]) / reach[key];
      const rNorm = (projected[key] - low[key]) / reach[key];
      sum += w * (uNorm - rNorm) ** 2;
    }
    return {
      result,
      projectedVector: projected,
      distance: Math.sqrt(sum),
    };
  });

  /* ---- 6. Softmax: distance → probability ---- */
  const scores = withDistances.map((d) => -alpha * d.distance ** 2);
  const probs = softmax(scores);

  /* ---- 7. Assemble ranked results ---- */
  const ranked: RankedRuntimeResultV2[] = withDistances.map((d, i) => ({
    result: d.result,
    similarity: Math.round(probs[i] * 100),
    distance: Math.round(d.distance * 100) / 100,
    probability: probs[i],
    originalVector: { ...d.result.result_vector },
    projectedVector: d.projectedVector,
  }));

  ranked.sort((a, b) => b.probability - a.probability);

  /* ---- 8. Confidence ---- */
  const top1 = ranked[0];
  const top2 = ranked.length > 1 ? ranked[1] : null;
  const margin = top2 ? top1.probability - top2.probability : 1;
  const confidence: "low" | "medium" | "high" =
    top1.probability < 0.45 || margin < 0.12
      ? "low"
      : margin < 0.25
        ? "medium"
        : "high";

  /* ---- 9. Debug info ---- */
  const debug: ScoringDebugInfo = {
    userVector,
    factorRanges: { low, high, reach },
    factorWeights: weights,
    results: ranked.map((r) => ({
      id: r.result.id,
      distance: r.distance,
      probability: r.probability,
      originalVector: r.originalVector,
      projectedVector: r.projectedVector,
    })),
    winner: { id: top1.result.id, name: top1.result.name },
    runnerUp: top2 ? { id: top2.result.id, name: top2.result.name } : null,
    confidence,
    margin,
  };

  return { ranked, debug };
}
