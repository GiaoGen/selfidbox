import { supabase } from "./supabase";
import { withTimeout } from "./supabase-timeout";

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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from("test_categories")
    .update({ ...payload, id })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as AdminCategoryRow;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
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
      let query = supabase
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
      const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from("test_sites")
    .update({ ...payload, id })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as AdminTestSiteRow;
}

export async function deleteTestSite(id: string) {
  const { error } = await supabase
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
      const { data: sites, error } = await supabase
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
      const { data, error } = await supabase
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
