import { supabase } from "./supabase";
import { keyedSingleQuery } from "./cache";

export interface UserProfileRow {
  user_id: string;
  selfid_profile: string | null;
  summary: string | null;
  core_vector: Record<string, number> | null;
  social_vector: Record<string, number> | null;
  report_count: number;
  updated_at: string;
}

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
