import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveQuizSchema, updateQuizSchema } from "@/lib/quizzes-db";
import type { SaveQuizInput } from "@/lib/quizzes-db";

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

  console.log("[QuizStudio] saving quiz for user", user.id);

  /* ---- 2. Parse body ---- */
  const body = (await request.json()) as SaveQuizInput & { quizId?: string };
  const { quizId, ...quizData } = body;

  console.log("[QuizStudio] creator_user_id", user.id);

  try {
    if (quizId) {
      // Update existing quiz
      const result = await updateQuizSchema(quizData, quizId);
      console.log("[QuizStudio] updated quizId", quizId);
      return NextResponse.json({ ok: true, ...result });
    }

    // Create new quiz
    const result = await saveQuizSchema(quizData, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[QuizStudio] save failed", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "保存失败" },
      { status: 500 },
    );
  }
}
