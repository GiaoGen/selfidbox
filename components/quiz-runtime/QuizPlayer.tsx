"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { QuizRuntimeData, AnswerRecord, RankedRuntimeResult } from "@/lib/quiz-runtime";
import { calculateUserVector, rankRuntimeResults } from "@/lib/quiz-runtime";
import { createClient } from "@/lib/supabase/client";
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
  const [phase, setPhase] = useState<Phase>("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const [ranking, setRanking] = useState<RankedRuntimeResult[] | null>(null);
  const [userVector, setUserVector] = useState<Record<string, number> | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncError, setSyncError] = useState<string>("");
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = quiz.questions;
  const total = questions.length;
  const factorKeys = quiz.factors.map((f) => f.key);
  const isLastQuestion = currentIndex === total - 1;

  const finishQuiz = useCallback(
    async (finalAnswers: AnswerRecord[]) => {
      const vector = calculateUserVector(factorKeys, finalAnswers);
      const ranked = rankRuntimeResults(vector, quiz.results);
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
    [factorKeys, quiz.id, quiz.results, supabase],
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

  if (phase === "result" && ranking && userVector) {
    return (
      <QuizResult
        ranking={ranking}
        quizTitle={quiz.title}
        quizSlug={quiz.slug}
        userVector={userVector}
        syncStatus={syncStatus}
        syncError={syncError}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex] ?? null;

  return (
    <div className="mx-auto w-full max-w-[560px]">
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
  );
}
