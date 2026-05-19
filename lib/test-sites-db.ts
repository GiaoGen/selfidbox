import { supabase } from "./supabase";
import type { TestSite, TestAccent } from "./test-sites";

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

export async function getCategories() {
  const { data, error } = await supabase
    .from("test_categories")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getCategories error:", error);
    return [];
  }

  return (data as CategoryRow[]) ?? [];
}

export async function getPublishedTestSites() {
  const { data, error } = await supabase
    .from("test_sites")
    .select(`
      *,
      category:test_categories(*)
    `)
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getPublishedTestSites error:", error);
    return [];
  }

  return (data as TestSiteRow[]) ?? [];
}

export async function getTestSiteBySlug(slug: string) {
  const { data, error } = await supabase
    .from("test_sites")
    .select(`
      *,
      category:test_categories(*)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    console.error("getTestSiteBySlug error:", error);
    return null;
  }

  return data as TestSiteRow | null;
}

export async function getTestSitesByCategory(categorySlug: string) {
  const { data: category, error: categoryError } = await supabase
    .from("test_categories")
    .select("id, slug, name, description")
    .eq("slug", categorySlug)
    .eq("status", "published")
    .single();

  if (categoryError || !category) {
    console.error("get category error:", categoryError);
    return { category: null, sites: [] as TestSiteRow[] };
  }

  const { data: sites, error: sitesError } = await supabase
    .from("test_sites")
    .select(`
      *,
      category:test_categories(*)
    `)
    .eq("category_id", (category as CategoryRow).id)
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true });

  if (sitesError) {
    console.error("get sites by category error:", sitesError);
    return { category: category as CategoryRow, sites: [] as TestSiteRow[] };
  }

  return { category: category as CategoryRow, sites: (sites as TestSiteRow[]) ?? [] };
}