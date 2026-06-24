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
    .select("id, creator_user_id, title")
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

  /* ---- 4. Delete related rows (inside-out) then quiz ---- */
  try {
    // quiz_attempt_answers
    await supabase
      .from("quiz_attempt_answers")
      .delete()
      .eq("quiz_id", quizId);

    // quiz_attempts
    await supabase
      .from("quiz_attempts")
      .delete()
      .eq("quiz_id", quizId);

    // quiz_options
    await supabase
      .from("quiz_options")
      .delete()
      .eq("quiz_id", quizId);

    // quiz_questions
    await supabase
      .from("quiz_questions")
      .delete()
      .eq("quiz_id", quizId);

    // quiz_results
    await supabase
      .from("quiz_results")
      .delete()
      .eq("quiz_id", quizId);

    // quiz_factors
    await supabase
      .from("quiz_factors")
      .delete()
      .eq("quiz_id", quizId);

    // quizzes
    const { error: deleteError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId);

    if (deleteError) {
      throw deleteError;
    }

    console.log("[QuizDelete] deleted quizId", quizId, "title", quiz.title);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[QuizDelete] failed", err);
    return NextResponse.json(
      {
        ok: false,
        error: "删除失败",
      },
      { status: 500 },
    );
  }
}
