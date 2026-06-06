import type { TestSite } from "@/lib/test-sites";
import type { AdminQuizRow } from "@/lib/admin-db";
import type { ExploreCard } from "./types";
import { accentFromId } from "./types";

/** Map a TestSite to unified ExploreCard */
export function testSiteToExploreCard(site: TestSite): ExploreCard {
  return {
    id: site.id,
    source_type: "official",
    href: `/test-sites/${site.id}`,
    title: site.name,
    description: site.description,
    image: "",
    category_id: site.category, // category slug — matches tab IDs for filtering
    categoryLabel: site.categoryLabel,
    featured: site.featured ?? false,
    popularity_score: site.popularity_score ?? 0,
    created_at: site.created_at ?? new Date().toISOString(),
    tags: site.tags ?? [],
    estimatedMinutes: site.estimatedMinutes ?? null,
    accent: site.accent,
  };
}

/** Map a quiz row to unified ExploreCard */
export function quizToExploreCard(
  quiz: AdminQuizRow,
  categoryLabel?: string,
  categorySlug?: string,
): ExploreCard {
  return {
    id: quiz.id,
    source_type: "community",
    href: `/quizzes/${quiz.slug}`,
    title: quiz.title,
    description: quiz.description ?? quiz.hook ?? "",
    image: quiz.cover_image_url ?? "",
    category_id: categorySlug ?? quiz.category?.slug ?? null, // category slug — matches tab IDs for filtering
    categoryLabel: categoryLabel ?? quiz.category?.name ?? "",
    featured: quiz.featured ?? false,
    popularity_score: 0, // quizzes don't have popularity_score yet — use attempt_count as proxy
    created_at: quiz.created_at,
    tags: [],
    estimatedMinutes: null,
    accent: accentFromId(quiz.id),
  };
}
