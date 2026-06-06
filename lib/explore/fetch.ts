import { supabase } from "@/lib/supabase";
import { listQuery } from "@/lib/cache";
import type { ExploreCard } from "./types";
import { quizToExploreCard } from "./mapper";
import type { AdminCategoryRow, AdminQuizRow } from "@/lib/admin-db";

/* ------------------------------------------------------------------ */
/*  Fetchers (use project cache helpers)                               */
/* ------------------------------------------------------------------ */

/** Fetch published test_categories */
async function fetchCategories(): Promise<AdminCategoryRow[]> {
  const { data, error } = await supabase
    .from("test_categories")
    .select("*")
    .eq("status", "published")
    .order("sort_order");

  if (error) {
    console.error("[explore] fetchCategories error:", error);
    return [];
  }
  return (data ?? []) as AdminCategoryRow[];
}

/** Fetch published quizzes */
async function fetchPublishedQuizzes(): Promise<AdminQuizRow[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("status", "published");

  if (error) {
    console.error("[explore] fetchPublishedQuizzes error:", error);
    return [];
  }
  return (data ?? []) as AdminQuizRow[];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch all published quizzes mapped to ExploreCard.
 * Categories are fetched in parallel for label resolution.
 */
export const getExploreQuizCards = listQuery(
  "getExploreQuizCards",
  async () => {
    const [quizzes, categories] = await Promise.all([
      fetchPublishedQuizzes(),
      fetchCategories(),
    ]);

    const catMap = new Map(categories.map((c) => [c.id, c]));

    return quizzes.map((q) =>
      quizToExploreCard(
        q,
        q.category_id ? catMap.get(q.category_id)?.name : undefined,
        q.category_id ? catMap.get(q.category_id)?.slug : undefined,
      ),
    );
  },
  60, // 1 min cache
);

/**
 * Fetch published quiz cards filtered by category slug.
 */
export async function getExploreQuizCardsByCategory(
  categorySlug: string,
): Promise<ExploreCard[]> {
  const [quizzes, categories] = await Promise.all([
    fetchPublishedQuizzes(),
    fetchCategories(),
  ]);

  const cat = categories.find((c) => c.slug === categorySlug);
  if (!cat) return [];

  const catMap = new Map(categories.map((c) => [c.id, c]));

  return quizzes
    .filter((q) => q.category_id === cat.id)
    .map((q) =>
      quizToExploreCard(
        q,
        catMap.get(q.category_id!)?.name,
        catMap.get(q.category_id!)?.slug,
      ),
    );
}
