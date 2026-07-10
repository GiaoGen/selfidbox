import type { TestSite } from "@/lib/test-sites";
import type { AdminQuizRow } from "@/lib/admin-db";
import type { ExploreCard } from "./types";
import { accentFromId } from "./types";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";
import { computeHeatScore } from "./sort";

/** Multiplier applied to internal quiz heat scores to counterbalance the
 *  engagement-scale gap between click_count (official) and attempt_count (community). */
const QUIZ_HEAT_BOOST = 1.5;

/** External test-site clicks carry far less user investment than completing
 *  a full quiz, so raw click_count scores are scaled down by this factor. */
const TEST_SITE_CLICK_WEIGHT = 0.15;

/** Map a TestSite to unified ExploreCard */
export function testSiteToExploreCard(site: TestSite): ExploreCard {
  const bg = site.color || nipponColorForSlug(site.id);
  return {
    id: site.id,
    source_type: "official",
    href: `/test-sites/${site.id}`,
    title: site.name,
    description: site.description,
    image: site.coverImageUrl ?? "",
    category_id: site.category, // category slug — matches tab IDs for filtering
    categoryLabel: site.categoryLabel,
    featured: site.featured ?? false,
    popularity_score: (site.popularity_score ?? 0) * TEST_SITE_CLICK_WEIGHT,
    created_at: site.created_at ?? new Date().toISOString(),
    tags: site.tags ?? [],
    estimatedMinutes: site.estimatedMinutes ?? null,
    accent: site.accent,
    bg_color: bg,
    text_color: textColorForNipponBg(bg),
  };
}

/** Map a quiz row to unified ExploreCard */
export function quizToExploreCard(
  quiz: AdminQuizRow,
  categoryLabel?: string,
  categorySlug?: string,
  resultImageUrl?: string,
  resultColor?: string | null,
): ExploreCard {
  // ① admin 手动设置 > ② 匹配的 result 颜色 > ③ hash 兜底
  const bg = quiz.color || resultColor || nipponColorForSlug(quiz.slug);
  // Use result image (from quiz_results) if available, otherwise empty
  const image = resultImageUrl ?? "";
  return {
    id: quiz.id,
    source_type: "community",
    href: `/quizzes/${quiz.slug}`,
    title: quiz.title,
    description: quiz.description ?? quiz.hook ?? "",
    image,
    category_id: categorySlug ?? quiz.category?.slug ?? null, // category slug — matches tab IDs for filtering
    categoryLabel: categoryLabel ?? quiz.category?.name ?? "",
    featured: quiz.featured ?? false,
    popularity_score: computeHeatScore(quiz.attempt_count ?? 0, quiz.created_at) * QUIZ_HEAT_BOOST,
    created_at: quiz.created_at,
    tags: [],
    estimatedMinutes: null,
    accent: accentFromId(quiz.id),
    bg_color: bg,
    text_color: textColorForNipponBg(bg),
  };
}
