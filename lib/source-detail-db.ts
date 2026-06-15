import { supabase as defaultSupabase } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ================================================================== */
/*  getSourceDetail                                                    */
/*                                                                     */
/*  Fetch detail data for a single profile source entry.               */
/*  Used by the Source Detail Modal on the Profile page.                */
/* ================================================================== */

/* ---- Types ---- */

export interface ReportDetailData {
  id: string;
  source_type: "report";
  report_type: string;
  main_result: string;
  created_at: string;
  input_type: string;
  image_url: string | null;
  normalized_summary: string | null;
  core_vector: Record<string, unknown> | null;
  social_vector: Record<string, unknown> | null;
}

export interface QuizDetailData {
  id: string;
  source_type: "quiz";
  created_at: string;
  quiz_title: string;
  quiz_slug: string;
  final_result_name: string;
  final_result_key: string;
  result_subtitle: string | null;
  result_description: string | null;
  result_image_url: string | null;
  result_traits: string[];
  result_share_text: string | null;
  user_vector: Record<string, number> | null;
}

export type SourceDetail = ReportDetailData | QuizDetailData | null;

/* ---- Main ---- */

export async function getSourceDetail(
  userId: string,
  sourceType: "report" | "quiz",
  id: string,
  client?: SupabaseClient,
): Promise<SourceDetail> {
  const db = client ?? defaultSupabase;
  if (sourceType === "report") {
    return getReportDetail(userId, id, db);
  }
  return getQuizAttemptDetail(userId, id, db);
}

/* ---- Report detail ---- */

async function getReportDetail(
  userId: string,
  id: string,
  db: SupabaseClient,
): Promise<ReportDetailData | null> {
  const { data, error } = await db
    .from("reports")
    .select(
      "id, report_type, main_result, created_at, input_type, image_url, normalized_summary, core_vector, social_vector",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    source_type: "report",
    report_type: (data.report_type as string) || "截图测评",
    main_result: (data.main_result as string) || "已解析",
    created_at: data.created_at,
    input_type: (data.input_type as string) || "screenshot",
    image_url: (data.image_url as string) ?? null,
    normalized_summary: (data.normalized_summary as string) ?? null,
    core_vector: (data.core_vector as Record<string, unknown>) ?? null,
    social_vector: (data.social_vector as Record<string, unknown>) ?? null,
  };
}

/* ---- Quiz attempt detail ---- */

async function getQuizAttemptDetail(
  userId: string,
  id: string,
  db: SupabaseClient,
): Promise<QuizDetailData | null> {
  const { data, error } = await db
    .from("quiz_attempts")
    .select("id, created_at, quiz_id, final_result_name, final_result_key, user_vector")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  // Join: quiz title + slug
  const { data: quiz } = await db
    .from("quizzes")
    .select("title, slug")
    .eq("id", data.quiz_id)
    .single();

  // Join: quiz result detail (match by key)
  let resultSubtitle: string | null = null;
  let resultDescription: string | null = null;
  let resultImageUrl: string | null = null;
  let resultTraits: string[] = [];
  let resultShareText: string | null = null;

  if (data.final_result_key && data.quiz_id) {
    const { data: resultRow } = await db
      .from("quiz_results")
      .select("subtitle, description, image_url, traits, share_text")
      .eq("quiz_id", data.quiz_id)
      .eq("key", data.final_result_key)
      .single();

    if (resultRow) {
      resultSubtitle = (resultRow.subtitle as string) ?? null;
      resultDescription = (resultRow.description as string) ?? null;
      resultImageUrl = (resultRow.image_url as string) ?? null;
      resultTraits = (resultRow.traits as string[]) ?? [];
      resultShareText = (resultRow.share_text as string) ?? null;
    }
  }

  return {
    id: data.id,
    source_type: "quiz",
    created_at: data.created_at,
    quiz_title: quiz?.title || "UGC Quiz",
    quiz_slug: quiz?.slug || "",
    final_result_name: (data.final_result_name as string) || (data.final_result_key as string) || "",
    final_result_key: (data.final_result_key as string) || "",
    result_subtitle: resultSubtitle,
    result_description: resultDescription,
    result_image_url: resultImageUrl,
    result_traits: resultTraits,
    result_share_text: resultShareText,
    user_vector: (data.user_vector as Record<string, number>) ?? null,
  };
}
