"use client";

import { useState, useCallback } from "react";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { QuizMetaCard } from "@/components/quiz-engine/QuizMetaCard";
import { ResultCard } from "@/components/quiz-engine/ResultCard";
import { FactorList } from "@/components/quiz-engine/FactorList";
import { ResultVectorCard } from "@/components/quiz-engine/ResultVectorCard";
import { DistanceValidator } from "@/components/quiz-engine/DistanceValidator";
import { QuestionEffectsCard } from "@/components/quiz-engine/QuestionEffectsCard";
import { CoverageValidator } from "@/components/quiz-engine/CoverageValidator";
import { SaveQuizButton } from "@/components/quiz-engine/SaveQuizButton";
import {
  quizMeta,
  results as initialResults,
  factors as initialFactors,
  resultVectors as initialVectors,
  questions as initialQuestions,
  mapAIResults,
} from "@/lib/mock-quiz-engine";
import type {
  QuizMeta,
  Result,
  Factor,
  ResultVector,
  Question,
  AIResult,
} from "@/lib/mock-quiz-engine";

/* ------------------------------------------------------------------ */
/*  State type                                                         */
/* ------------------------------------------------------------------ */

interface QuizState {
  meta: QuizMeta;
  results: Result[];
  factors: Factor[];
  resultVectors: ResultVector[];
  questions: Question[];
}

function defaultVector(factors: Factor[]): Record<string, number> {
  return Object.fromEntries(factors.map((f) => [f.id, 50]));
}

/* ------------------------------------------------------------------ */
/*  Step label                                                         */
/* ------------------------------------------------------------------ */

function StepLabel({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
        {num}
      </span>
      <h2 className="text-3xl font-semibold tracking-[-0.03em]">{label}</h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CreatePage() {
  const [quiz, setQuiz] = useState<QuizState>({
    meta: quizMeta,
    results: initialResults,
    factors: initialFactors,
    resultVectors: initialVectors,
    questions: initialQuestions,
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  /* ---- Meta ---- */

  const updateMeta = useCallback((patch: Partial<QuizMeta>) => {
    setQuiz((prev) => ({ ...prev, meta: { ...prev.meta, ...patch } }));
  }, []);

  /* ---- Results ---- */

  const updateResult = useCallback((index: number, result: Result) => {
    setQuiz((prev) => ({
      ...prev,
      results: prev.results.map((r, i) => (i === index ? result : r)),
    }));
  }, []);

  const deleteResult = useCallback((index: number) => {
    setQuiz((prev) => {
      const id = prev.results[index]?.id;
      return {
        ...prev,
        results: prev.results.filter((_, i) => i !== index),
        resultVectors: prev.resultVectors.filter((rv) => rv.resultId !== id),
      };
    });
  }, []);

  const addResult = useCallback(() => {
    setQuiz((prev) => {
      const id = `result_${Date.now()}`;
      return {
        ...prev,
        results: [
          ...prev.results,
          { id, name: "新结果", description: "", traits: [] },
        ],
        resultVectors: [
          ...prev.resultVectors,
          { resultId: id, values: defaultVector(prev.factors) },
        ],
      };
    });
  }, []);

  /* ---- Factors ---- */

  const updateFactor = useCallback((index: number, factor: Factor) => {
    setQuiz((prev) => ({
      ...prev,
      factors: prev.factors.map((f, i) => (i === index ? factor : f)),
    }));
  }, []);

  const addFactor = useCallback(() => {
    setQuiz((prev) => {
      const id = `factor_${Date.now()}`;
      return {
        ...prev,
        factors: [...prev.factors, { id, name: "新因子", nameEn: "" }],
        resultVectors: prev.resultVectors.map((rv) => ({
          ...rv,
          values: { ...rv.values, [id]: 50 },
        })),
      };
    });
  }, []);

  const deleteFactor = useCallback((index: number) => {
    setQuiz((prev) => {
      const id = prev.factors[index]?.id;
      if (!id) return prev;
      return {
        ...prev,
        factors: prev.factors.filter((_, i) => i !== index),
        resultVectors: prev.resultVectors.map((rv) => {
          const next = { ...rv.values };
          delete next[id];
          return { ...rv, values: next };
        }),
      };
    });
  }, []);

  /* ---- Result Vectors ---- */

  const updateResultVectorValue = useCallback(
    (resultId: string, factorId: string, value: number) => {
      setQuiz((prev) => ({
        ...prev,
        resultVectors: prev.resultVectors.map((rv) =>
          rv.resultId === resultId
            ? { ...rv, values: { ...rv.values, [factorId]: value } }
            : rv,
        ),
      }));
    },
    [],
  );

  /* ---- Questions ---- */

  const updateQuestion = useCallback((index: number, question: Question) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? question : q)),
    }));
  }, []);

  const addQuestion = useCallback(() => {
    setQuiz((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `q_${Date.now()}`,
          text: "新题目",
          options: [
            {
              label: "A",
              text: "",
              effects: Object.fromEntries(prev.factors.map((f) => [f.id, 0])),
            },
            {
              label: "B",
              text: "",
              effects: Object.fromEntries(prev.factors.map((f) => [f.id, 0])),
            },
          ],
        },
      ],
    }));
  }, []);

  const deleteQuestion = useCallback((index: number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }, []);

  /* ---- AI Generate Results ---- */

  async function handleGenerateResults() {
    setAiLoading(true);
    setAiError("");

    try {
      const res = await fetch("/api/quiz-ai/generate-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quiz.meta.title,
          hook: quiz.meta.hook,
          quiz_type: quiz.meta.quiz_type,
          audience: quiz.meta.audience
            .split("/")
            .map((s) => s.trim())
            .filter(Boolean),
          tone: quiz.meta.tone
            .split("/")
            .map((s) => s.trim())
            .filter(Boolean),
          result_count: 5,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error ?? "AI 生成失败，请重试");
        return;
      }

      const aiResults = data.results as AIResult[];
      const newResults = mapAIResults(aiResults);

      setQuiz((prev) => ({
        ...prev,
        results: newResults,
        resultVectors: newResults.map((r) => ({
          resultId: r.id,
          values: defaultVector(prev.factors),
        })),
      }));
    } catch {
      setAiError("网络错误，请检查连接后重试");
    } finally {
      setAiLoading(false);
    }
  }

  /* ---- Render ---- */

  const { meta, results, factors, resultVectors, questions } = quiz;

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <TopNavbar />

        {/* Hero */}
        <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#1a3a3a_0%,#b8a4ed_40%,#ffb084_85%)] p-6 text-white shadow-[0_18px_50px_rgba(10,10,10,0.1)] sm:p-10">
          <p className="text-sm font-semibold opacity-70">AI Quiz Studio</p>
          <h1 className="mt-2 text-4xl font-semibold leading-none tracking-[-0.04em] sm:text-5xl">
            AI Quiz Studio
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 opacity-85 sm:text-lg">
            用向量空间创建一个更稳定、更有解释力的人格测试。
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 opacity-70">
            一个好的测试不是简单地给结果加分，而是让用户通过答题形成一个人格向量，再匹配最接近的结果人格。
          </p>
        </section>

        {/* Step 1: Quiz Meta */}
        <section className="space-y-4">
          <StepLabel num={1} label="Quiz Meta" />
          <QuizMetaCard meta={meta} onChange={updateMeta} />
        </section>

        {/* Step 2: Results */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <StepLabel num={2} label="Results" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addResult}
                className="inline-flex h-9 items-center gap-1 rounded-full bg-[var(--ink)]/6 px-4 text-sm font-semibold text-[var(--ink)] transition-all hover:bg-[var(--ink)]/12"
              >
                + 添加结果
              </button>
              <button
                type="button"
                onClick={handleGenerateResults}
                disabled={aiLoading}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_100%)] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(10,10,10,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(10,10,10,0.15)] disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    AI 生成中...
                  </>
                ) : (
                  "AI 生成结果人格"
                )}
              </button>
            </div>
          </div>
          <p className="text-base leading-7 text-[var(--body)]">
            定义测试可能产生的结果人格，每个结果有独立的名称、描述和特质标签。
          </p>
          {aiError && <p className="text-sm text-red-600">{aiError}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result, i) => (
              <ResultCard
                key={result.id}
                result={result}
                index={i}
                onChange={(r) => updateResult(i, r)}
                onDelete={results.length > 1 ? () => deleteResult(i) : undefined}
              />
            ))}
          </div>
        </section>

        {/* Step 3: Factors */}
        <section className="space-y-4">
          <StepLabel num={3} label="Factors" />
          <FactorList
            factors={factors}
            onChange={updateFactor}
            onAdd={addFactor}
            onDelete={factors.length > 1 ? deleteFactor : undefined}
          />
        </section>

        {/* Step 4: Result Vectors */}
        <section className="space-y-4">
          <StepLabel num={4} label="Result Vectors" />
          <p className="text-base leading-7 text-[var(--body)]">
            为每个结果在每个因子维度上设定 0-100 的位置，构成该结果的人格向量。
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {resultVectors.map((rv, i) => {
              const result = results.find((r) => r.id === rv.resultId);
              if (!result) return null;
              return (
                <ResultVectorCard
                  key={rv.resultId}
                  result={result}
                  vector={rv}
                  factors={factors}
                  index={i}
                  onValueChange={(factorId, value) =>
                    updateResultVectorValue(rv.resultId, factorId, value)
                  }
                />
              );
            })}
          </div>
        </section>

        {/* Step 5: Distance Validator */}
        <DistanceValidator
          resultVectors={resultVectors}
          results={results}
        />

        {/* Step 6: Questions + Option Effects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <StepLabel num={6} label="Questions + Option Effects" />
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-[var(--ink)]/6 px-4 text-sm font-semibold text-[var(--ink)] transition-all hover:bg-[var(--ink)]/12"
            >
              + 添加题目
            </button>
          </div>
          <p className="text-base leading-7 text-[var(--body)]">
            每道题的每个选项都会在特定因子上产生增量效果，用户的最终向量是所有选项效果的累加。
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {questions.map((q, i) => (
              <QuestionEffectsCard
                key={q.id}
                question={q}
                factors={factors}
                index={i}
                onChange={(updated) => updateQuestion(i, updated)}
                onDelete={
                  questions.length > 1
                    ? () => deleteQuestion(i)
                    : undefined
                }
              />
            ))}
          </div>
        </section>

        {/* Step 7: Coverage Validator */}
        <CoverageValidator questions={questions} factors={factors} />

        {/* Save */}
        <section className="flex justify-center pb-16 pt-8">
          <SaveQuizButton
            quiz={{
              meta,
              results,
              factors,
              resultVectors,
              questions,
            }}
          />
        </section>
      </div>
    </main>
  );
}
