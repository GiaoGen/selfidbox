import { supabase } from "./supabase";
import { keyedSingleQuery } from "./cache";
import { logger } from "@/lib/logger";

export interface DimOut {
  value: number;
  confidence: number;
  count: number;
}

export interface UserProfileRow {
  user_id: string;
  selfid_profile: string | null;
  summary: string | null;
  core_vector: Record<string, DimOut> | null;
  social_vector: Record<string, DimOut> | null;
  report_count: number;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Data sources (reports + quiz_attempts) for the profile modal       */
/* ------------------------------------------------------------------ */

export interface ProfileSourceEntry {
  id: string;
  source_type: "report" | "quiz";
  created_at: string;
  title: string;
  result: string;
  meta: string;
  /* Card-ready fields (populated at list-fetch time so clicks open instantly).
     Undefined = not populated; null = populated but empty (e.g. no screenshot). */
  image_url?: string | null;
  subtitle?: string | null;
  description?: string | null;
  traits?: string[];
  share_text?: string | null;
}

export async function getProfileSources(userId: string): Promise<ProfileSourceEntry[]> {
  /* ---- A. Reports ---- */

  const { data: reports, error: reportError } = await supabase
    .from("reports")
    .select("id, created_at, user_id, report_type, main_result, parse_status, input_type, image_url")
    .eq("user_id", userId)
    .eq("parse_status", "normalized");

  logger.debug("[ProfileSources] reports count", reports?.length);
  logger.debug("[ProfileSources] reports error", reportError);

  /* ---- B. Quiz attempts ---- */

  const { data: attempts, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("id, created_at, quiz_id, final_result_name, final_result_key")
    .eq("user_id", userId)
    .eq("included_in_profile", true);

  if (attemptError) {
    console.warn(`[getProfileSources] quiz_attempts query failed: ${attemptError.message}`);
  }

  /* ---- C. Batch-fetch quiz titles ---- */

  const quizIds = [...new Set((attempts ?? []).map((a) => a.quiz_id).filter(Boolean))];
  const quizMap: Record<string, { title: string; slug: string }> = {};

  if (quizIds.length > 0) {
    const { data: quizzes, error: quizError } = await supabase
      .from("quizzes")
      .select("id, title, slug")
      .in("id", quizIds);

    if (quizError) {
      console.warn(`[getProfileSources] quizzes query failed: ${quizError.message}`);
    } else {
      for (const q of quizzes ?? []) {
        quizMap[q.id] = { title: q.title, slug: q.slug };
      }
    }
  }

  /* ---- C2. Batch-fetch quiz_results (for instant card display) ---- */

  const resultMap: Record<string, {
    subtitle: string | null;
    description: string | null;
    image_url: string | null;
    traits: string[];
    share_text: string | null;
  }> = {};

  if (quizIds.length > 0) {
    const { data: allResults, error: resultsError } = await supabase
      .from("quiz_results")
      .select("quiz_id, key, subtitle, description, image_url, traits, share_text")
      .in("quiz_id", quizIds);

    if (resultsError) {
      console.warn(`[getProfileSources] quiz_results query failed: ${resultsError.message}`);
    } else {
      for (const r of allResults ?? []) {
        const compositeKey = `${r.quiz_id}:${r.key}`;
        resultMap[compositeKey] = {
          subtitle: (r.subtitle as string) ?? null,
          description: (r.description as string) ?? null,
          image_url: (r.image_url as string) ?? null,
          traits: (r.traits as string[]) ?? [],
          share_text: (r.share_text as string) ?? null,
        };
      }
    }
  }

  /* ---- D. Transform to unified format ---- */

  const reportSources: ProfileSourceEntry[] = [];

  for (const r of reports ?? []) {
    reportSources.push({
      id: r.id,
      source_type: "report",
      created_at: r.created_at,
      title: (r.report_type as string) || "截图测评",
      result: (r.main_result as string) || "已解析",
      meta: (r.input_type as string) === "screenshot" ? "截图导入" : "报告导入",
      image_url: (r.image_url as string) ?? null,
    });
  }

  const quizSources: ProfileSourceEntry[] = [];

  for (const a of attempts ?? []) {
    const quiz = quizMap[a.quiz_id];
    const resultKey = a.final_result_key ? `${a.quiz_id}:${a.final_result_key}` : "";
    const card = resultKey ? resultMap[resultKey] : undefined;
    quizSources.push({
      id: a.id,
      source_type: "quiz",
      created_at: a.created_at,
      title: quiz?.title || "UGC Quiz",
      result: (a.final_result_name as string) || (a.final_result_key as string) || "已完成",
      meta: "Quiz Studio",
      /* Card-ready fields (instant open, no detail API call needed) */
      image_url: card?.image_url ?? null,
      subtitle: card?.subtitle ?? null,
      description: card?.description ?? null,
      traits: card?.traits ?? [],
      share_text: card?.share_text ?? null,
    });
  }

  logger.debug("[ProfileSources] quiz sources count", quizSources.length);

  /* ---- E. Merge & sort newest first ---- */

  const sources = [...reportSources, ...quizSources];
  sources.sort((a, b) => b.created_at.localeCompare(a.created_at));

  logger.debug("[ProfileSources] final sources count", sources.length);

  return sources;
}

/* ------------------------------------------------------------------ */
/*  Cached user_profile reader                                         */
/* ------------------------------------------------------------------ */

export const getUserProfile = keyedSingleQuery(
  "getUserProfile",
  async (userId: string) => {
    const { data, error } = await supabase
      .from("user_profile")
      .select("*")
      .eq("user_id", userId)
      .single();

    // PGRST116 = 0 rows, expected when user has no profile yet
    if (error) {
      if (error.code !== "PGRST116") throw error;
      return null;
    }

    return data as UserProfileRow | null;
  },
  5, // 5 sec — short, so OCR upload → refresh sees new data quickly
);
