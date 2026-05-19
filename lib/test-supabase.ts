import { supabase } from "./supabase";

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from("test_categories")
    .select("*")
    .limit(5);

  if (error) {
    console.error("Supabase test error:", error);
    return [];
  }

  return data;
}