"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { QuizRuntimeData, AnswerRecord, RankedRuntimeResult, RankedRuntimeResultV2 } from "@/lib/quiz-runtime";
import { calculateUserVector, rankRuntimeResultsV2, MAX_SANDBOX_ATTEMPTS } from "@/lib/quiz-runtime";
import { createClient } from "@/lib/supabase/client";
import { isSafari } from "@/lib/browser-detect";
import { useNipponTheme } from "./useNipponTheme";
import { QuizProgress } from "./QuizProgress";
import { QuestionCard } from "./QuestionCard";
import { QuizResult } from "./QuizResult";
import styles from "./quiz-runtime.module.css";

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
  const [createdAt, setCreatedAt] = useState<string>();
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload result images during quiz phase so the share card renders instantly
  useEffect(() => {
    quiz.results.forEach((r) => {
      if (r.image_url) {
        if (isSafari()) {
          // Safari/WebKit: dual-channel preload to prime both the decode cache
          // and the HTTP cache independently — WebKit's new Image() alone is a
          // low-priority speculative fetch that may never fully decode.
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => { img.decode().catch(() => {}); };
          img.src = r.image_url;
          // Channel 2: prime HTTP cache so the <img> tag gets a cache hit even
          // if the decoded bitmap was evicted during the quiz session.
          fetch(r.image_url, { mode: "cors" }).catch(() => {});
        } else {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = r.image_url;
        }
      }
    });
  }, [quiz.results]);

  const questions = quiz.questions;
  const total = questions.length;
  const factorKeys = quiz.factors.map((f) => f.key);
  const isLastQuestion = currentIndex === total - 1;

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
      setCreatedAt(new Date().toISOString());
      setPhase("result");

      // Attempt to save via API route if authenticated
      setSyncStatus("syncing");
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          setSyncStatus("not-authenticated");
          sessionStorage.setItem("pendingQuizSave", JSON.stringify({
            quizId: quiz.id,
            userVector: vector,
            ranking: ranked,
            answers: finalAnswers,
          }));
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
          const saved = await res.json().catch(() => null);
          if (typeof saved?.createdAt === "string") setCreatedAt(saved.createdAt);
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

  // Sandbox / submitting both capped at MAX_SANDBOX_ATTEMPTS
  const attemptLimitReached =
    (quiz.status === "sandbox" || quiz.status === "submitting") &&
    quiz.attempt_count >= MAX_SANDBOX_ATTEMPTS;

  if (attemptLimitReached) {
    return (
      <div className={`${styles.receipt} mx-auto w-full max-w-[560px] px-5 py-12 text-center sm:px-8`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-dashed border-[var(--ink)]/20">
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
        syncStatus={syncStatus}
        syncError={syncError}
        accentColor={ranking[0]?.result.color || theme.accent}
        createdAt={createdAt}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex] ?? null;

  return (
    <>
      <div className={`${styles.receipt} relative z-10 mx-auto w-full max-w-[560px] px-5 py-8 sm:px-8 sm:py-10`}>
      {/* Header */}
      <div className="mb-6 border-b-2 border-dashed border-[var(--ink)]/15 pb-6">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-[var(--muted)]">
          <span className="font-mono tracking-wider">SelfIDBox</span>
          <span>{quiz.quiz_type === "personality" ? "人格测试" : quiz.quiz_type === "fun" ? "趣味测试" : "测试"}</span>
        </div>
        <h1 className="mt-4 text-[26px] font-bold leading-snug tracking-[-0.02em] text-[var(--ink)] sm:text-[30px]">
          {quiz.title}
        </h1>
        {quiz.hook && (
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--body)]">
            {quiz.hook}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
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
      <div className="mt-6 flex items-center justify-between border-t-2 border-dashed border-[var(--ink)]/15 pt-5">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="inline-flex min-h-11 items-center gap-1.5 border border-[var(--ink)]/15 px-4 py-2 text-sm font-medium text-[var(--body)] transition-colors hover:bg-[var(--ink)]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:opacity-30"
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
