import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQuizForEdit } from "@/lib/quizzes-db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  /* ---- 1. Auth check ---- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "NOT_AUTHENTICATED" },
      { status: 401 },
    );
  }

  /* ---- 2. Parse query ---- */
  const quizId = request.nextUrl.searchParams.get("quiz_id");

  if (!quizId) {
    return NextResponse.json(
      { ok: false, error: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  /* ---- 3. Fetch (getQuizForEdit already checks ownership) ---- */
  const data = await getQuizForEdit(quizId, user.id);

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, quiz: data });
}
