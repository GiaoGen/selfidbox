import type { ExploreCard } from "./types";

/* ------------------------------------------------------------------ */
/*  Unified Heat Score                                                  */
/*                                                                      */
/*  Works for both test_sites (click_count) and quizzes (attempt_count). */
/*  Formula:  log(1 + engagement) / (age_days + 2)^0.5 × boost          */
/*                                                                      */
/*  - log(1+x):   logarithmic compression — prevents winner-take-all    */
/*  - ^0.5:       gentle time decay (slower than HN's 1.8 on hours)     */
/*  - +2:         prevents division by zero for brand-new items          */
/*  - cold_start: 2× linear fade over first 48 hours                     */
/* ------------------------------------------------------------------ */

export function computeHeatScore(engagement: number, createdAt: string): number {
  const created = new Date(createdAt);
  const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);

  // Logarithmic compression — 1000 clicks isn't 100× better than 10
  const effectiveEngagement = Math.log(1 + engagement);

  // Gentle time decay
  const timeDecay = Math.pow(ageDays + 2, 0.5);

  // Cold-start boost: 2× at publish → 1.5× after 1 day → 1× after 2 days
  const coldStartBoost = 1 + Math.max(0, (2 - ageDays) * 0.5);

  return (effectiveEngagement / timeDecay) * coldStartBoost;
}

/* ------------------------------------------------------------------ */
/*  Shared sort                                                         */
/*                                                                      */
/*  Order: featured DESC → popularity_score DESC → created_at DESC      */
/* ------------------------------------------------------------------ */

export function sortExploreCards(cards: ExploreCard[]): ExploreCard[] {
  return [...cards].sort((a, b) => {
    // 1. Featured first
    if (a.featured !== b.featured) return b.featured ? 1 : -1;
    // 2. Then by popularity score descending
    if (a.popularity_score !== b.popularity_score)
      return b.popularity_score - a.popularity_score;
    // 3. Then by created_at descending (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
