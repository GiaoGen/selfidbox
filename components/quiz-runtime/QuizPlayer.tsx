"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { QuizRuntimeData, AnswerRecord, RankedRuntimeResult, RankedRuntimeResultV2 } from "@/lib/quiz-runtime";
import { calculateUserVector, rankRuntimeResults, rankRuntimeResultsV2, MAX_SANDBOX_ATTEMPTS } from "@/lib/quiz-runtime";
import { createClient } from "@/lib/supabase/client";
import { useNipponTheme } from "./useNipponTheme";
import { ResultBackgroundManager } from "./ResultBackgroundManager";
import { QuizProgress } from "./QuizProgress";
import { QuestionCard } from "./QuestionCard";
import { QuizResult } from "./QuizResult";

type Phase = "quiz" | "result";
type SyncStatus = "idle" | "syncing" | "synced" | "not-authenticated" | "error";

interface Props {
  quiz: QuizRuntimeData;
}

export function QuizPlayer({ quiz }: Props) {
  const supabase = createClient();
  const theme = useNipponTheme();
  const [phase, setPhase] = useState<Phase>("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const [ranking, setRanking] = useState<RankedRuntimeResult[] | RankedRuntimeResultV2[] | null>(null);
  const [userVector, setUserVector] = useState<Record<string, number> | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncError, setSyncError] = useState<string>("");
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = quiz.questions;
  const total = questions.length;
  const factorKeys = quiz.factors.map((f) => f.key);
  const isLastQuestion = currentIndex === total - 1;

  // Intermediate ranking — recomputed after each answer, drives the dynamic background
  const intermediateRanking = useMemo(() => {
    const answeredSoFar = answers
      .slice(0, currentIndex)
      .filter((a): a is AnswerRecord => !!a);
    if (answeredSoFar.length === 0) {
      const defaultVector: Record<string, number> = {};
      for (const key of factorKeys) defaultVector[key] = 50;
      return rankRuntimeResults(defaultVector, quiz.results);
    }
    const vector = calculateUserVector(factorKeys, answeredSoFar);
    const { ranked } = rankRuntimeResultsV2(
      vector,
      quiz.results,
      quiz.questions,
      factorKeys,
    );
    return ranked;
  }, [answers, currentIndex, factorKeys, quiz.results, quiz.questions]);

  const finishQuiz = useCallback(
    async (finalAnswers: AnswerRecord[]) => {
      const vector = calculateUserVector(factorKeys, finalAnswers);
      const { ranked, debug } = rankRuntimeResultsV2(
        vector,
        quiz.results,
        quiz.questions,
        factorKeys,
      );
      if (process.env.NODE_ENV === "development") {
        console.log("[ScoringV2 debug]", debug);
      }
      setUserVector(vector);
      setRanking(ranked);
      setPhase("result");

      // Attempt to save via API route if authenticated
      setSyncStatus("syncing");
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          setSyncStatus("not-authenticated");
          return;
        }

        const res = await fetch("/api/quiz-attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId: quiz.id,
            userVector: vector,
            ranking: ranked,
            answers: finalAnswers,
          }),
        });

        if (res.ok) {
          setSyncStatus("synced");
        } else {
          const errBody = await res.json().catch(() => ({}));
          setSyncStatus("error");
          setSyncError(errBody.error ?? "保存失败");
        }
      } catch (err) {
        console.warn("[QuizPlayer] sync attempt failed", err);
        setSyncStatus("error");
        setSyncError(err instanceof Error ? err.message : "网络错误");
      }
    },
    [factorKeys, quiz.id, quiz.results, quiz.questions, supabase],
  );

  const handleSelect = useCallback(
    (answer: AnswerRecord) => {
      if (selectedOptionId !== null) return; // already selected
      setSelectedOptionId(answer.optionId);

      const updated = answers.slice(0, currentIndex);
      updated[currentIndex] = answer;
      setAnswers(updated);

      transitionTimer.current = setTimeout(() => {
        if (isLastQuestion) {
          finishQuiz(updated);
        } else {
          setDirection(1);
          setCurrentIndex((i) => i + 1);
          setSelectedOptionId(null);
        }
      }, 300);
    },
    [answers, currentIndex, selectedOptionId, isLastQuestion, finishQuiz],
  );

  const handleBack = useCallback(() => {
    if (currentIndex === 0) return;
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
    setSelectedOptionId(null);
  }, [currentIndex]);

  // Sandbox limit check
  const sandboxReached =
    quiz.status === "sandbox" && quiz.attempt_count >= MAX_SANDBOX_ATTEMPTS;

  if (sandboxReached) {
    return (
      <div className="mx-auto w-full max-w-[560px] py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ink)]/8">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--muted)]"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
          试玩次数已满
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
          该 Quiz 已达到试玩次数上限（{MAX_SANDBOX_ATTEMPTS} 次），等待作者提交审核。
        </p>
      </div>
    );
  }

  if (phase === "result" && ranking && userVector) {
    return (
      <QuizResult
        ranking={ranking}
        quizTitle={quiz.title}
        quizSlug={quiz.slug}
        userVector={userVector}
        syncStatus={syncStatus}
        syncError={syncError}
        accentColor={ranking[0]?.result.color || theme.accent}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex] ?? null;

  return (
    <>
      {/* ── Dynamic personality reveal background ── */}
      <ResultBackgroundManager ranking={intermediateRanking} />

      <div className="relative z-10 mx-auto w-full max-w-[560px]">
      {/* Header */}
      <div className="mb-10">
        <p className="text-sm font-medium text-[var(--muted)]">
          {quiz.quiz_type === "personality" ? "人格测试" : quiz.quiz_type === "fun" ? "趣味测试" : "测试"}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
          {quiz.title}
        </h1>
        {quiz.hook && (
          <p className="mt-1 text-[15px] leading-relaxed text-[var(--body)]">
            {quiz.hook}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="mb-10">
        <QuizProgress current={currentIndex + 1} total={total} />
      </div>

      {/* Question */}
      <QuestionCard
        question={currentQuestion}
        selectedOptionId={currentAnswer?.optionId ?? null}
        locked={selectedOptionId !== null}
        direction={direction}
        onSelect={handleSelect}
      />

      {/* Back button */}
      <div className="mt-8 flex items-center justify-center">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-[var(--muted)] transition-all hover:text-[var(--ink)] disabled:opacity-30 disabled:hover:text-[var(--muted)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          上一题
        </button>
      </div>
    </div>
    </>
  );
}
