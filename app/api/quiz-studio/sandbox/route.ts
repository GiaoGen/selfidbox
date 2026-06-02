import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  /* ---- 2. Parse body ---- */
  const { quizId } = (await request.json()) as { quizId: string };

  if (!quizId) {
    return NextResponse.json(
      { ok: false, error: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  /* ---- 3. Verify ownership ---- */
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id, creator_user_id, status")
    .eq("id", quizId)
    .single();

  if (quizError || !quiz) {
    return NextResponse.json(
      { ok: false, error: "Quiz not found" },
      { status: 404 },
    );
  }

  if (quiz.creator_user_id !== user.id) {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN" },
      { status: 403 },
    );
  }

  if (quiz.status !== "draft") {
    return NextResponse.json(
      { ok: false, error: `Cannot publish from status: ${quiz.status}` },
      { status: 400 },
    );
  }

  /* ---- 4. Update ---- */
  const { error: updateError } = await supabase
    .from("quizzes")
    .update({ status: "sandbox" })
    .eq("id", quizId);

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: updateError.message },
      { status: 500 },
    );
  }

  console.log("[QuizStudio] published sandbox", quizId);
  return NextResponse.json({ ok: true });
}
