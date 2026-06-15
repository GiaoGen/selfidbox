import { createClient as createSSRClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withTimeout } from "./supabase-timeout";

async function getDb(): Promise<SupabaseClient> {
  return createSSRClient();
}

/* ------------------------------------------------------------------ */
/*  Row types (extends existing with admin-only fields)                */
/* ------------------------------------------------------------------ */

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  status: string;
  created_at?: string;
}

export interface AdminTestSiteRow {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  description: string | null;
  long_description: string | null;
  url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  language: string | null;
  country: string | null;
  estimated_minutes: number | null;
  difficulty: string | null;
  pricing: string | null;
  supports_email_report: boolean;
  email_report_note: string | null;
  status: "draft" | "published" | "archived";
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
  category: AdminCategoryRow | null;
}

/* ------------------------------------------------------------------ */
/*  Category CRUD                                                      */
/* ------------------------------------------------------------------ */

export async function getAdminCategories(): Promise<AdminCategoryRow[]> {
  return withTimeout(
    async () => {
      const { data, error } = await (await getDb())
        .from("test_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data as AdminCategoryRow[]) ?? [];
    },
    [],
    "getAdminCategories",
  );
}

export async function getAdminCategoryById(id: string): Promise<AdminCategoryRow | null> {
  return withTimeout(
    async () => {
      const { data, error } = await (await getDb())
        .from("test_categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as AdminCategoryRow | null;
    },
    null,
    "getAdminCategoryById",
  );
}

export async function createCategory(
  payload: Omit<AdminCategoryRow, "id" | "created_at">
) {
  const { data, error } = await (await getDb())
    .from("test_categories")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as AdminCategoryRow;
}

export async function updateCategory(
  id: string,
  payload: Partial<Omit<AdminCategoryRow, "id" | "created_at">>
) {
  const { data, error } = await (await getDb())
    .from("test_categories")
    .update({ ...payload, id })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as AdminCategoryRow;
}

export async function deleteCategory(id: string) {
  const { error } = await (await getDb())
    .from("test_categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Test Site CRUD                                                     */
/* ------------------------------------------------------------------ */

export interface TestSiteFilters {
  search?: string;
  categoryId?: string;
  status?: string;
}

export async function getAdminTestSites(
  filters?: TestSiteFilters
): Promise<AdminTestSiteRow[]> {
  return withTimeout(
    async () => {
      let query = (await getDb())
        .from("test_sites")
        .select("*, category:test_categories(*)")
        .order("sort_order", { ascending: true });

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }
      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as AdminTestSiteRow[]) ?? [];
    },
    [],
    "getAdminTestSites",
  );
}

export async function getAdminTestSiteById(
  id: string
): Promise<AdminTestSiteRow | null> {
  return withTimeout(
    async () => {
      const { data, error } = await (await getDb())
        .from("test_sites")
        .select("*, category:test_categories(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as AdminTestSiteRow | null;
    },
    null,
    "getAdminTestSiteById",
  );
}

export async function createTestSite(
  payload: Omit<AdminTestSiteRow, "id" | "created_at" | "updated_at" | "category">
) {
  const { data, error } = await (await getDb())
    .from("test_sites")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as AdminTestSiteRow;
}

export async function updateTestSite(
  id: string,
  payload: Partial<Omit<AdminTestSiteRow, "id" | "created_at" | "updated_at" | "category">>
) {
  const { data, error } = await (await getDb())
    .from("test_sites")
    .update({ ...payload, id })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as AdminTestSiteRow;
}

export async function deleteTestSite(id: string) {
  const { error } = await (await getDb())
    .from("test_sites")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Dashboard stats                                                    */
/* ------------------------------------------------------------------ */

export async function getAdminStats() {
  return withTimeout(
    async () => {
      const { data: sites, error } = await (await getDb())
        .from("test_sites")
        .select("status");

      if (error) throw error;

      const total = sites.length;
      const published = sites.filter((s) => s.status === "published").length;
      const draft = sites.filter((s) => s.status === "draft").length;
      const archived = sites.filter((s) => s.status === "archived").length;

      return { total, published, draft, archived };
    },
    { total: 0, published: 0, draft: 0, archived: 0 },
    "getAdminStats",
  );
}

export async function getRecentTestSites(limit = 5): Promise<AdminTestSiteRow[]> {
  return withTimeout(
    async () => {
      const { data, error } = await (await getDb())
        .from("test_sites")
        .select("*, category:test_categories(*)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as AdminTestSiteRow[]) ?? [];
    },
    [],
    "getRecentTestSites",
  );
}

/* ------------------------------------------------------------------ */
/*  Quizzes admin                                                      */
/* ------------------------------------------------------------------ */

export interface AdminQuizRow {
  id: string;
  slug: string;
  title: string;
  hook: string;
  quiz_type: string;
  status: string;
  creator_user_id: string;
  attempt_count: number;
  abstractness: number;
  seriousness: number;
  depth: number;
  poeticness: number;
  description: string | null;
  cover_image_url: string | null;
  category_id: string | null;
  featured: boolean;
  created_at: string;
  category: AdminCategoryRow | null;
}

export interface AdminQuizFilters {
  search?: string;
  status?: string;
}

/** Fetch all quizzes with optional search + status filter */
export async function getAdminQuizzes(
  filters?: AdminQuizFilters,
): Promise<AdminQuizRow[]> {
  return withTimeout(
    async () => {
      // Fetch quizzes and categories in parallel (avoids FK dependency)
      const [quizResult, catResult] = await Promise.all([
        (async () => {
          let q = (await getDb())
            .from("quizzes")
            .select("*")
            .order("created_at", { ascending: false });
          if (filters?.search) q = q.ilike("title", `%${filters.search}%`);
          if (filters?.status) q = q.eq("status", filters.status);
          return q;
        })(),
        (await getDb()).from("test_categories").select("*"),
      ]);

      if (quizResult.error) throw quizResult.error;

      const categories = (catResult.data ?? []) as AdminCategoryRow[];
      const catMap = new Map(categories.map((c) => [c.id, c]));

      const quizzes = (quizResult.data ?? []) as AdminQuizRow[];
      // Join category in memory
      return quizzes.map((q) => ({
        ...q,
        category: q.category_id ? (catMap.get(q.category_id) ?? null) : null,
      }));
    },
    [],
    "getAdminQuizzes",
  );
}

/** Fetch a single quiz by ID */
export async function getAdminQuizById(
  id: string,
): Promise<AdminQuizRow | null> {
  return withTimeout(
    async () => {
      const { data, error } = await (await getDb())
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) return null;

      const quiz = data as AdminQuizRow;

      // Fetch category separately if needed
      if (quiz.category_id) {
        const { data: cat } = await (await getDb())
          .from("test_categories")
          .select("*")
          .eq("id", quiz.category_id)
          .single();
        quiz.category = (cat as AdminCategoryRow) ?? null;
      } else {
        quiz.category = null;
      }

      return quiz;
    },
    null,
    "getAdminQuizById",
  );
}

export interface UpdateQuizMetadataInput {
  title?: string;
  description?: string | null;
  cover_image_url?: string | null;
  category_id?: string | null;
  featured?: boolean;
  status?: string;
}

/** Lightweight metadata update — does NOT touch questions/results/factors */
export async function updateQuizMetadata(
  id: string,
  input: UpdateQuizMetadataInput,
): Promise<AdminQuizRow> {
  const { data, error } = await (await getDb())
    .from("quizzes")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as AdminQuizRow;
}

/** Delete a quiz and all its sub-rows */
export async function deleteQuiz(id: string): Promise<void> {
  // Delete sub-rows first (cascade not guaranteed on all environments)
  await Promise.all([
    (await getDb()).from("quiz_options").delete().eq("quiz_id", id),
    (await getDb()).from("quiz_questions").delete().eq("quiz_id", id),
    (await getDb()).from("quiz_results").delete().eq("quiz_id", id),
    (await getDb()).from("quiz_factors").delete().eq("quiz_id", id),
    (await getDb()).from("quiz_attempt_answers").delete().eq("quiz_id", id),
    (await getDb()).from("quiz_attempts").delete().eq("quiz_id", id),
  ]);

  const { error } = await (await getDb()).from("quizzes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Count quizzes by status for dashboard stats */
export async function getAdminQuizStats(): Promise<{
  total: number;
  published: number;
  draft: number;
  sandbox: number;
  submitted: number;
  archived: number;
}> {
  const { data, error } = await (await getDb())
    .from("quizzes")
    .select("status");

  if (error || !data) {
    return { total: 0, published: 0, draft: 0, sandbox: 0, submitted: 0, archived: 0 };
  }

  return {
    total: data.length,
    published: data.filter((r) => r.status === "published").length,
    draft: data.filter((r) => r.status === "draft").length,
    sandbox: data.filter((r) => r.status === "sandbox").length,
    submitted: data.filter((r) => r.status === "submitted").length,
    archived: data.filter((r) => r.status === "archived").length,
  };
}
