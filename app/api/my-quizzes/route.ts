import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  /* ---- 1. Auth check ---- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "NOT_AUTHENTICATED", quizzes: [] },
      { status: 401 },
    );
  }

  console.log("[MyQuizzes] userId", user.id);

  /* ---- 2. Query creator's quizzes ---- */
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, slug, title, hook, status, attempt_count, created_at")
    .eq("creator_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[MyQuizzes] query error:", error);
    return NextResponse.json({ ok: false, error: "查询失败", quizzes: [] }, { status: 500 });
  }

  console.log("[MyQuizzes] count", data?.length ?? 0);

  return NextResponse.json({ ok: true, quizzes: data ?? [] });
}
