import { supabase } from "@/lib/supabase";
import { listQuery } from "@/lib/cache";
import type { ExploreCard } from "./types";
import { quizToExploreCard } from "./mapper";
import type { AdminCategoryRow, AdminQuizRow } from "@/lib/admin-db";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic pick from array using seed */
function pickFrom<T>(arr: T[], seed: string): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[hashString(seed) % arr.length];
}

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
    .select("id, slug, title, hook, description, category_id, quiz_type, status, attempt_count, featured, color, created_at")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("attempt_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[explore] fetchPublishedQuizzes error:", error);
    return [];
  }

  return (data ?? []) as AdminQuizRow[];
}

/** Fetch non-null result image_urls grouped by quiz_id */
async function fetchResultImages(
  quizIds: string[],
): Promise<Map<string, string[]>> {
  if (quizIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("quiz_results")
    .select("quiz_id, image_url")
    .in("quiz_id", quizIds)
    .not("image_url", "is", null)
    .limit(300);

  if (error || !data) {
    console.error("[explore] fetchResultImages error:", error);
    return new Map();
  }

  const map = new Map<string, string[]>();
  for (const row of data as { quiz_id: string; image_url: string }[]) {
    const urls = map.get(row.quiz_id) || [];
    urls.push(row.image_url);
    map.set(row.quiz_id, urls);
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch all published quizzes mapped to ExploreCard.
 * Categories and result images are fetched in parallel.
 */
export const getExploreQuizCards = listQuery(
  "getExploreQuizCards",
  async () => {
    const [quizzes, categories] = await Promise.all([
      fetchPublishedQuizzes(),
      fetchCategories(),
    ]);

    const quizIds = quizzes.map((q) => q.id);
    const resultImages = await fetchResultImages(quizIds);

    const catMap = new Map(categories.map((c) => [c.id, c]));

    const cards = quizzes.map((q) => {
      const images = resultImages.get(q.id) || [];
      const pickedImage = pickFrom(images, q.slug); // deterministic, stable per quiz
      return quizToExploreCard(
        q,
        q.category_id ? catMap.get(q.category_id)?.name : undefined,
        q.category_id ? catMap.get(q.category_id)?.slug : undefined,
        pickedImage,
      );
    });

    return cards;
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

  const quizIds = quizzes.filter((q) => q.category_id === cat.id).map((q) => q.id);
  const resultImages = await fetchResultImages(quizIds);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  const cards = quizzes
    .filter((q) => q.category_id === cat.id)
    .slice(0, 100)
    .map((q) => {
      const images = resultImages.get(q.id) || [];
      const pickedImage = pickFrom(images, q.slug);
      return quizToExploreCard(
        q,
        catMap.get(q.category_id!)?.name,
        catMap.get(q.category_id!)?.slug,
        pickedImage,
      );
    });

  return cards;
}
