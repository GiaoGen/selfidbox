import { createClient as createSSRClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TestSite, TestAccent } from "./test-sites";
import { listQuery, keyedSingleQuery, keyedObjectQuery } from "./cache";
import { computeHeatScore } from "@/lib/explore/sort";

async function getDb(): Promise<SupabaseClient> {
  return createSSRClient();
}

/* ------------------------------------------------------------------ */
/*  Supabase row shapes                                                */
/* ------------------------------------------------------------------ */

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  sort_order: number;
}

export interface TestSiteRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  tags: string[] | null;
  estimated_minutes: number | null;
  supports_email_report: boolean | null;
  difficulty: string | null;
  url: string | null;
  source_name: string | null;
  source_url: string | null;
  category_id: string;
  status: string;
  featured: boolean;
  sort_order: number;
  accent: string | null;
  popularity: string | null;
  best_for: string | null;
  created_at: string;
  popularity_score: number | null;
  cover_image_url: string | null;
  category: CategoryRow | null;
}

/* ------------------------------------------------------------------ */
/*  Adapters: Supabase row → app types                                 */
/* ------------------------------------------------------------------ */

const ACCENTS: TestAccent[] = ["pink", "teal", "lavender", "peach", "ochre", "mint"];
const VALID_ACCENTS = new Set<string>(ACCENTS);
const VALID_DIFFICULTIES = new Set<string>(["轻松", "标准", "深入"]);

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function deriveAccent(seed: string): TestAccent {
  return ACCENTS[hashSeed(seed) % ACCENTS.length];
}

function deriveDifficulty(minutes: number): TestSite["difficulty"] {
  if (minutes <= 5) return "轻松";
  if (minutes <= 10) return "标准";
  return "深入";
}

export function mapTestSite(row: TestSiteRow): TestSite {
  const cat = row.category;
  const minutes = row.estimated_minutes ?? 10;

  return {
    id: row.slug || row.id,
    slug: row.slug,
    name: row.name,
    category: cat?.slug ?? "uncategorized",
    categoryLabel: cat?.name ?? "",
    description: row.description ?? "",
    longDescription: row.long_description ?? row.description ?? "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    estimatedMinutes: minutes,
    supportsEmailReport: row.supports_email_report ?? false,
    difficulty: (
      VALID_DIFFICULTIES.has(row.difficulty ?? "")
        ? row.difficulty
        : deriveDifficulty(minutes)
    ) as TestSite["difficulty"],
    sourceName: row.source_name ?? "",
    sourceUrl: row.source_url ?? "#",
    url: row.url ?? "#",
    popularity: row.popularity ?? undefined,
    accent: VALID_ACCENTS.has(row.accent ?? "")
      ? (row.accent as TestAccent)
      : deriveAccent(row.slug || row.id),
    bestFor: row.best_for ?? undefined,
    featured: row.featured,
    created_at: row.created_at,
    popularity_score: row.popularity_score ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
  };
}

export interface ExploreCategory {
  id: string;
  slug: string;
  label: string;
  href: string;
  description: string;
  accent: TestAccent;
}

export function mapCategory(row: CategoryRow): ExploreCategory {
  return {
    id: row.slug,
    slug: row.slug,
    label: row.name,
    href: `/explore/${row.slug}`,
    description: row.description ?? "",
    accent: deriveAccent(row.slug),
  };
}

/* ------------------------------------------------------------------ */
/*  Supabase queries                                                   */
/* ------------------------------------------------------------------ */

export const getCategories = listQuery(
  "getCategories",
  async () => {
    const { data, error } = await (await getDb())
      .from("test_categories")
      .select("*")
      .eq("status", "published")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data as CategoryRow[]) ?? [];
  },
  600, // 10 min
);

export const getPublishedTestSites = listQuery(
  "getPublishedTestSites",
  async () => {
    const { data, error } = await (await getDb())
      .from("test_sites")
      .select(`
        *,
        category:test_categories(*)
      `)
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data as TestSiteRow[]) ?? [];
  },
  60, // 1 min
);

export const getTestSiteBySlug = keyedSingleQuery(
  "getTestSiteBySlug",
  async (slug: string) => {
    const { data, error } = await (await getDb())
      .from("test_sites")
      .select(`
        *,
        category:test_categories(*)
      `)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error) throw error;
    return data as TestSiteRow | null;
  },
  60, // 1 min
);

export const getTestSitesByCategory = keyedObjectQuery(
  "getTestSitesByCategory",
  async (categorySlug: string) => {
    const { data: category, error: categoryError } = await (await getDb())
      .from("test_categories")
      .select("id, slug, name, description")
      .eq("slug", categorySlug)
      .eq("status", "published")
      .single();

    if (categoryError) throw categoryError;
    if (!category) return { category: null, sites: [] as TestSiteRow[] };

    const { data: sites, error: sitesError } = await (await getDb())
      .from("test_sites")
      .select(`
        *,
        category:test_categories(*)
      `)
      .eq("category_id", (category as CategoryRow).id)
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true });

    if (sitesError) throw sitesError;
    return { category: category as CategoryRow, sites: (sites as TestSiteRow[]) ?? [] };
  },
  { category: null, sites: [] as TestSiteRow[] },
  60, // 1 min TTL
);

/* ------------------------------------------------------------------ */
/*  Click tracking                                                     */
/* ------------------------------------------------------------------ */

function computePopularityScore(clickCount: number, createdAt: string) {
  return computeHeatScore(clickCount, createdAt);
}

export async function updateTestSitePopularity(testSiteId: string) {
  const { data: site, error } = await (await getDb())
    .from("test_sites")
    .select("click_count, created_at")
    .eq("id", testSiteId)
    .single();

  if (error || !site) {
    console.error("updateTestSitePopularity: site not found", { testSiteId, error });
    return { success: false as const, error };
  }

  const clickCount = site.click_count ?? 0;
  const score = computePopularityScore(clickCount, site.created_at);

  const { error: updateError } = await (await getDb())
    .from("test_sites")
    .update({ popularity_score: score })
    .eq("id", testSiteId);

  if (updateError) {
    console.error("updateTestSitePopularity: update error", updateError);
    return { success: false as const, error: updateError };
  }

  const created = new Date(site.created_at);
  const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);

  console.log("updateTestSitePopularity:", {
    testSiteId,
    click_count: clickCount,
    age_days: Math.round(ageDays * 10) / 10,
    popularity_score: Math.round(score * 100) / 100,
  });

  return { success: true as const, score };
}

export async function recordTestSiteClick(slug: string) {
  const { data: site, error: findError } = await createServiceClient()
    .from("test_sites")
    .select("id, click_count, created_at")
    .eq("slug", slug)
    .single();

  if (findError || !site) {
    console.error("recordTestSiteClick: site not found", { slug, error: findError });
    return { success: false as const, error: findError };
  }

  const newClickCount = (site.click_count ?? 0) + 1;
  const popularityScore = computePopularityScore(newClickCount, site.created_at);

  const { error: updateError } = await createServiceClient()
    .from("test_sites")
    .update({
      click_count: newClickCount,
      popularity_score: popularityScore,
    })
    .eq("id", site.id);

  if (updateError) {
    console.error("recordTestSiteClick: update error", updateError);
    return { success: false as const, error: updateError };
  }

  console.log("recordTestSiteClick:", {
    slug,
    click_count: newClickCount,
    popularity_score: Math.round(popularityScore * 100) / 100,
  });

  return { success: true as const };
}