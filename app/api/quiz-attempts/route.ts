import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rebuildUserProfile } from "@/lib/rebuild-user-profile";
import { MAX_SANDBOX_ATTEMPTS } from "@/lib/quiz-runtime";
import { grantCredit } from "@/lib/credits/service";
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

  /* ---- 2.5 Limited-status attempt cap (sandbox + submitting: max 20 runs) ---- */
  const { data: quizRow } = await supabase
    .from("quizzes")
    .select("creator_user_id, status, attempt_count, abstractness, seriousness, depth, poeticness, title_relevance, goofiness")
    .eq("id", quizId)
    .single();

  const isLimited = quizRow?.status === "sandbox" || quizRow?.status === "submitting";
  if (isLimited && (quizRow.attempt_count ?? 0) >= MAX_SANDBOX_ATTEMPTS) {
    return NextResponse.json(
      { ok: false, error: "SANDBOX_LIMIT_REACHED" },
      { status: 403 },
    );
  }

  /* ---- 3. Compute profile weight from quiz style controls ---- */
  const styleSum =
    (100 - (quizRow?.abstractness ?? 50)) +
    (quizRow?.seriousness ?? 50) +
    (quizRow?.depth ?? 50) +
    (100 - (quizRow?.poeticness ?? 50)) +
    (100 - (quizRow?.title_relevance ?? 50)) +
    (100 - (quizRow?.goofiness ?? 50));

  const profileWeight = Math.min(0.95, Math.max(0.05, styleSum / 600));

  /* ---- 4. Insert quiz_attempts ---- */
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
      profile_weight: profileWeight,
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

  /* ---- 5. Increment quiz attempt_count ---- */
  try {
    const { data: quizRow } = await supabase
      .from("quizzes")
      .select("attempt_count")
      .eq("id", quizId)
      .single();

    const newCount = (quizRow?.attempt_count ?? 0) + 1;
    await supabase
      .from("quizzes")
      .update({ attempt_count: newCount })
      .eq("id", quizId);

    console.log("[QuizAttempt] attempt_count incremented to", newCount);
  } catch (err) {
    console.warn("[QuizAttempt] increment attempt_count failed", err);
  }

  /* ---- 5.5 Grant +1 credit to quiz creator (if not self-complete) ---- */
  if (
    quizRow?.creator_user_id &&
    quizRow.creator_user_id !== user.id
  ) {
    try {
      await grantCredit(
        quizRow.creator_user_id,
        "quiz_completed",
        1,
        `${quizId}::${user.id}`,
      );
    } catch (err) {
      console.warn("[QuizAttempt] grantCredit failed:", err);
    }
  }

  /* ---- 6. Update user_profile ---- */
  console.log("[QuizAttempt] updating user_profile");

  try {
    const result = await rebuildUserProfile(user.id, supabase);
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

  /* ---- 7. Return ---- */
  return NextResponse.json({
    ok: true,
    attemptId: attempt.id,
  });
}
