import type { ResultVector, Question, Factor, UserVector, Result } from "./mock-quiz-engine";

export function calculateDistance(a: Record<string, number>, b: Record<string, number>): number {
  const keys = Object.keys(a);
  const sum = keys.reduce((acc, key) => acc + Math.pow((a[key] ?? 0) - (b[key] ?? 0), 2), 0);
  return Math.sqrt(sum);
}

const MAX_DISTANCE = Math.sqrt(5 * 100 * 100);

export function calculateSimilarity(distance: number): number {
  return Math.round(Math.max(0, (1 - distance / MAX_DISTANCE)) * 100);
}

export interface RankedResult {
  result: Result;
  similarity: number;
  distance: number;
}

export function rankResults(
  userVector: UserVector,
  resultVectors: ResultVector[],
  results: Result[],
): RankedResult[] {
  const ranked = resultVectors
    .map((rv) => {
      const result = results.find((r) => r.id === rv.resultId);
      if (!result) return null;
      const distance = calculateDistance(userVector, rv.values);
      return {
        result,
        similarity: calculateSimilarity(distance),
        distance: Math.round(distance * 100) / 100,
      };
    })
    .filter((r): r is RankedResult => r !== null);

  ranked.sort((a, b) => b.similarity - a.similarity);
  return ranked;
}

export interface DistancePair {
  resultA: Result;
  resultB: Result;
  distance: number;
  similarity: number;
  close: boolean;
}

export function validateResultDistances(
  resultVectors: ResultVector[],
  results: Result[],
): { pairs: DistancePair[]; threshold: number } {
  const threshold = 55;
  const pairs: DistancePair[] = [];

  for (let i = 0; i < resultVectors.length; i++) {
    for (let j = i + 1; j < resultVectors.length; j++) {
      const resultA = results.find((r) => r.id === resultVectors[i].resultId);
      const resultB = results.find((r) => r.id === resultVectors[j].resultId);
      if (!resultA || !resultB) continue;
      const distance = calculateDistance(resultVectors[i].values, resultVectors[j].values);
      const similarity = calculateSimilarity(distance);
      pairs.push({
        resultA,
        resultB,
        distance: Math.round(distance * 100) / 100,
        similarity,
        close: similarity > threshold,
      });
    }
  }

  pairs.sort((a, b) => b.similarity - a.similarity);
  return { pairs, threshold };
}

export interface CoverageResult {
  factor: Factor;
  covered: boolean;
  totalEffect: number;
}

export function validateQuestionCoverage(
  questions: Question[],
  factors: Factor[],
): CoverageResult[] {
  return factors.map((factor) => {
    let totalEffect = 0;
    for (const q of questions) {
      for (const opt of q.options) {
        totalEffect += Math.abs(opt.effects[factor.id] ?? 0);
      }
    }
    return {
      factor,
      covered: totalEffect > 0,
      totalEffect,
    };
  });
}
