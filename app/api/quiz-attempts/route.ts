import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rebuildUserProfile } from "@/lib/rebuild-user-profile";
import type {
  AnswerRecord,
  RankedRuntimeResult,
} from "@/lib/quiz-runtime";

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

  console.log("[QuizAttempt] userId", user.id);

  /* ---- 2. Parse request body ---- */
  const body = (await request.json()) as {
    quizId: string;
    userVector: Record<string, number>;
    ranking: RankedRuntimeResult[];
    answers: AnswerRecord[];
  };

  const { quizId, userVector, ranking, answers } = body;

  console.log("[QuizAttempt] quizId", quizId);

  if (!quizId || !userVector || !ranking || !answers) {
    return NextResponse.json(
      { ok: false, error: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const top = ranking[0];

  console.log("[QuizAttempt] finalResult", top?.result.key ?? "(none)");

  /* ---- 3. Insert quiz_attempts ---- */
  console.log("[QuizAttempt] inserting attempt");

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      user_vector: userVector,
      similarity_ranking: ranking.slice(0, 3).map((r) => ({
        result_key: r.result.key,
        result_name: r.result.name,
        similarity: r.similarity,
      })),
      final_result_id: top?.result.id ?? null,
      final_result_key: top?.result.key ?? null,
      final_result_name: top?.result.name ?? null,
      included_in_profile: true,
      profile_weight: 0.3,
    })
    .select("id")
    .single();

  if (attemptError) {
    console.error("[QuizAttempt] attempt insert failed", attemptError.message);
    return NextResponse.json(
      { ok: false, error: `保存答题记录失败：${attemptError.message}` },
      { status: 500 },
    );
  }

  console.log("[QuizAttempt] attempt saved", attempt.id);

  /* ---- 4. Insert quiz_attempt_answers ---- */
  const answerRows = answers.map((a) => ({
    attempt_id: attempt.id,
    quiz_id: quizId,
    question_id: a.questionId,
    option_id: a.optionId,
  }));

  const { error: answerError } = await supabase
    .from("quiz_attempt_answers")
    .insert(answerRows);

  if (answerError) {
    // best-effort: don't rollback attempt, just log
    console.error("[QuizAttempt] answers insert failed", answerError.message);
  } else {
    console.log("[QuizAttempt] answers saved");
  }

  /* ---- 5. Update user_profile ---- */
  console.log("[QuizAttempt] updating user_profile");

  try {
    const result = await rebuildUserProfile(user.id);
    console.log(
      "[QuizAttempt] profile_rebuild_result",
      JSON.stringify(result),
    );
  } catch (err) {
    console.warn(
      "[QuizAttempt] profile_rebuild_result failed —",
      err instanceof Error ? err.message : err,
    );
  }

  /* ---- 6. Return ---- */
  return NextResponse.json({
    ok: true,
    attemptId: attempt.id,
  });
}
