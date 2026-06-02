import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TARGETS = ["draft", "sandbox", "submitted"] as const;
type AllowedTarget = (typeof ALLOWED_TARGETS)[number];

/** Valid transitions: current → target */
const VALID_TRANSITIONS: Record<string, Set<string>> = {
  draft: new Set(["sandbox"]),
  sandbox: new Set(["draft", "submitted"]),
  submitted: new Set([]), // no going back
};

function isValidTransition(
  current: string,
  target: AllowedTarget,
): boolean {
  const allowed = VALID_TRANSITIONS[current];
  return allowed?.has(target) ?? false;
}

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
  const { quizId, status: targetStatus } = (await request.json()) as {
    quizId: string;
    status: string;
  };

  if (!quizId || !targetStatus) {
    return NextResponse.json(
      { ok: false, error: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TARGETS.includes(targetStatus as AllowedTarget)) {
    return NextResponse.json(
      { ok: false, error: `Invalid target status: ${targetStatus}` },
      { status: 400 },
    );
  }

  /* ---- 3. Verify ownership + current status ---- */
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

  /* ---- 4. Validate transition ---- */
  if (!isValidTransition(quiz.status, targetStatus as AllowedTarget)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Cannot transition from ${quiz.status} to ${targetStatus}`,
      },
      { status: 400 },
    );
  }

  /* ---- 5. Update ---- */
  const { error: updateError } = await supabase
    .from("quizzes")
    .update({ status: targetStatus })
    .eq("id", quizId);

  if (updateError) {
    return NextResponse.json(
      { ok: false, error: updateError.message },
      { status: 500 },
    );
  }

  console.log("[QuizStatus] quizId", quizId, "status", quiz.status, "→", targetStatus);
  return NextResponse.json({ ok: true });
}
