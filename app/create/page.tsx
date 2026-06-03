"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Library, Sparkles, Wand, Settings } from "lucide-react";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { QuizMetaCard } from "@/components/quiz-engine/QuizMetaCard";
import { QuizStyleControls } from "@/components/quiz-engine/QuizStyleControls";
import { ResultCard } from "@/components/quiz-engine/ResultCard";
import { FactorList } from "@/components/quiz-engine/FactorList";
import { ResultVectorCard } from "@/components/quiz-engine/ResultVectorCard";
import { DistanceValidator } from "@/components/quiz-engine/DistanceValidator";
import { QuestionEffectsCard } from "@/components/quiz-engine/QuestionEffectsCard";
import { CoverageValidator } from "@/components/quiz-engine/CoverageValidator";
import { SaveQuizButton } from "@/components/quiz-engine/SaveQuizButton";
import { MyQuizzesModal } from "@/components/quiz-runtime/MyQuizzesModal";
import { mapAIResults, DEFAULT_STYLE } from "@/lib/mock-quiz-engine";
import { SELFID_FACTORS } from "@/lib/selfid-factors";
import type {
  QuizMeta,
  QuizStyleControls as QuizStyleControlsType,
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
  abstractness: number;
  seriousness: number;
  depth: number;
  poeticness: number;
}

const emptyMeta: QuizMeta = {
  title: "",
  hook: "",
  quiz_type: "personality",
  audience: "",
  tone: "",
};

function defaultVector(factors: Factor[]): Record<string, number> {
  return Object.fromEntries(factors.map((f) => [f.id, 50]));
}

/* ------------------------------------------------------------------ */
/*  Step label                                                         */
/* ------------------------------------------------------------------ */

function StepLabel({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-semibold text-white">
        {num}
      </span>
      <h2 className="text-xl font-semibold tracking-[-0.02em]">{label}</h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Range selector — scrollable number pills                            */
/* ------------------------------------------------------------------ */

function RangeSelector({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const options: number[] = [];
  for (let i = min; i <= max; i++) options.push(i);

  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--ink)]/6 p-0.5 text-xs overflow-x-auto max-w-[260px] sm:max-w-[360px]"
      style={{ scrollbarWidth: "none" }}
    >
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`shrink-0 rounded-full px-2 py-0.5 font-semibold transition-all ${
            value === n
              ? "bg-white text-[var(--ink)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          {n}
        </button>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editQuizId = searchParams.get("quiz_id");

  const [quiz, setQuiz] = useState<QuizState>({
    meta: emptyMeta,
    results: [],
    factors: [],
    resultVectors: [],
    questions: [],
    ...DEFAULT_STYLE,
  });

  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const isEditMode = editQuizId !== null;

  // Load quiz data for editing
  useEffect(() => {
    if (!editQuizId) return;

    setEditLoading(true);
    setEditError("");

    fetch(`/api/quiz-studio/edit?quiz_id=${editQuizId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setEditError(data.error ?? "加载失败");
          return;
        }
        setQuiz(data.quiz);
      })
      .catch(() => setEditError("网络错误"))
      .finally(() => setEditLoading(false));
  }, [editQuizId]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiFactorsLoading, setAiFactorsLoading] = useState(false);
  const [aiFactorsError, setAiFactorsError] = useState("");
  const [aiVectorsLoading, setAiVectorsLoading] = useState(false);
  const [aiVectorsError, setAiVectorsError] = useState("");
  const [aiQuestionsLoading, setAiQuestionsLoading] = useState(false);
  const [aiQuestionsError, setAiQuestionsError] = useState("");

  const [resultCount, setResultCount] = useState(6);
  const [factorCount, setFactorCount] = useState(5);
  const [questionCount, setQuestionCount] = useState(8);
  const [optionsPerQuestion, setOptionsPerQuestion] = useState(4);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [myQuizzesOpen, setMyQuizzesOpen] = useState(false);
  const [showFactorPicker, setShowFactorPicker] = useState(false);

  /* ---- Meta ---- */

  const updateMeta = useCallback((patch: Partial<QuizMeta>) => {
    setQuiz((prev) => ({ ...prev, meta: { ...prev.meta, ...patch } }));
  }, []);

  const updateStyle = useCallback((patch: Partial<QuizStyleControlsType>) => {
    setQuiz((prev) => ({ ...prev, ...patch }));
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

  const togglePin = useCallback((index: number) => {
    setQuiz((prev) => ({
      ...prev,
      results: prev.results.map((r, i) =>
        i === index ? { ...r, isPinned: !r.isPinned } : r,
      ),
    }));
  }, []);

  const addResult = useCallback(() => {
    setQuiz((prev) => {
      const id = `result_${Date.now()}`;
      return {
        ...prev,
        results: [
          ...prev.results,
          { id, name: "新结果", description: "", traits: [], isPinned: false },
        ],
        resultVectors: [
          ...prev.resultVectors,
          { resultId: id, values: defaultVector(prev.factors), isPinned: false },
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
    setShowFactorPicker(true);
  }, []);

  const selectFactor = useCallback((key: string) => {
    const sf = SELFID_FACTORS.find((f) => f.key === key);
    if (!sf) return;
    setQuiz((prev) => ({
      ...prev,
      factors: [...prev.factors, { id: sf.key, name: sf.name, nameEn: sf.description, isPinned: false }],
      resultVectors: prev.resultVectors.map((rv) => ({
        ...rv,
        values: { ...rv.values, [sf.key]: 50 },
      })),
    }));
    setShowFactorPicker(false);
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

  const toggleFactorPin = useCallback((index: number) => {
    setQuiz((prev) => ({
      ...prev,
      factors: prev.factors.map((f, i) =>
        i === index ? { ...f, isPinned: !f.isPinned } : f,
      ),
    }));
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

  const toggleResultVectorPin = useCallback((resultId: string) => {
    setQuiz((prev) => ({
      ...prev,
      resultVectors: prev.resultVectors.map((rv) =>
        rv.resultId === resultId ? { ...rv, isPinned: !rv.isPinned } : rv,
      ),
    }));
  }, []);

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
          isPinned: false,
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

  const toggleQuestionPin = useCallback((index: number) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, isPinned: !q.isPinned } : q,
      ),
    }));
  }, []);

  /* ---- AI Generate Results ---- */

  async function handleGenerateResults() {
    setAiLoading(true);
    setAiError("");

    const pinnedResults = quiz.results.filter((r) => r.isPinned);
    const remaining = Math.max(1, resultCount - pinnedResults.length);

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
          result_count: remaining,
          abstractness: quiz.abstractness,
          seriousness: quiz.seriousness,
          depth: quiz.depth,
          poeticness: quiz.poeticness,
          pinned_results: pinnedResults.map((r) => ({
            key: r.id,
            name: r.name,
            traits: r.traits,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error ?? "AI 生成失败，请重试");
        return;
      }

      const aiResults = data.results as AIResult[];
      const newResults = mapAIResults(aiResults);

      setQuiz((prev) => {
        const merged = [...pinnedResults, ...newResults];
        const pinnedIds = new Set(pinnedResults.map((r) => r.id));
        return {
          ...prev,
          results: merged,
          resultVectors: merged.map((r) => {
            const existing = prev.resultVectors.find((rv) => rv.resultId === r.id);
            const keepExisting = pinnedIds.has(r.id) && existing != null;
            return {
              resultId: r.id,
              values: keepExisting ? existing.values : defaultVector(prev.factors),
              isPinned: keepExisting ? existing.isPinned : false,
            };
          }),
        };
      });
    } catch {
      setAiError("网络错误，请检查连接后重试");
    } finally {
      setAiLoading(false);
    }
  }

  /* ---- AI Generate Factors ---- */

  async function handleGenerateFactors() {
    setAiFactorsLoading(true);
    setAiFactorsError("");

    const pinnedFactors = quiz.factors.filter((f) => f.isPinned);
    const remaining = Math.max(1, factorCount - pinnedFactors.length);

    try {
      const res = await fetch("/api/quiz-ai/generate-factors", {
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
          results: quiz.results.map((r) => ({
            key: r.id,
            name: r.name,
            subtitle: r.subtitle ?? "",
            description: r.description,
            traits: r.traits,
          })),
          factor_count: remaining,
          pinned_factors: pinnedFactors.map((f) => ({
            key: f.id,
            name: f.name,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiFactorsError(data.error ?? "AI 生成失败，请重试");
        return;
      }

      const aiFactors = data.factors as {
        key: string;
        name: string;
        description?: string;
      }[];

      const newFactors: Factor[] = aiFactors.map((f) => ({
        id: f.key,
        name: f.name,
        nameEn: f.description ?? "",
        isPinned: false,
      }));

      const merged = [...pinnedFactors, ...newFactors];
      const allKeys = new Set(merged.map((f) => f.id));

      setQuiz((prev) => ({
        ...prev,
        factors: merged,
        resultVectors: prev.resultVectors.map((rv) => {
          const nextValues: Record<string, number> = {};
          for (const key of allKeys) {
            nextValues[key] = rv.values[key] ?? 50;
          }
          return { ...rv, values: nextValues };
        }),
      }));
    } catch {
      setAiFactorsError("网络错误，请检查连接后重试");
    } finally {
      setAiFactorsLoading(false);
    }
  }

  /* ---- AI Generate Result Vectors ---- */

  async function handleGenerateResultVectors() {
    setAiVectorsLoading(true);
    setAiVectorsError("");

    const pinnedVectors = quiz.resultVectors.filter((rv) => rv.isPinned);
    const pinnedResultIds = new Set(pinnedVectors.map((rv) => rv.resultId));
    const unpinnedResults = quiz.results.filter((r) => !pinnedResultIds.has(r.id));

    try {
      const res = await fetch("/api/quiz-ai/generate-result-vectors", {
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
          results: unpinnedResults.map((r) => ({
            key: r.id,
            name: r.name,
            subtitle: r.subtitle ?? "",
            description: r.description,
            traits: r.traits,
          })),
          factors: quiz.factors.map((f) => ({
            key: f.id,
            name: f.name,
            description: f.nameEn ?? "",
          })),
          pinned_vectors: pinnedVectors.map((rv) => {
            const r = quiz.results.find((x) => x.id === rv.resultId);
            return { key: rv.resultId, name: r?.name ?? rv.resultId, values: rv.values };
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiVectorsError(data.error ?? "AI 生成失败，请重试");
        return;
      }

      const newVectors = data.result_vectors as Record<string, Record<string, number>>;

      setQuiz((prev) => ({
        ...prev,
        resultVectors: prev.results.map((r) => {
          const pinned = pinnedVectors.find((pv) => pv.resultId === r.id);
          if (pinned) return pinned;
          return {
            resultId: r.id,
            values: newVectors[r.id] ?? prev.resultVectors.find((rv) => rv.resultId === r.id)?.values ?? defaultVector(prev.factors),
            isPinned: false,
          };
        }),
      }));
    } catch {
      setAiVectorsError("网络错误，请检查连接后重试");
    } finally {
      setAiVectorsLoading(false);
    }
  }

  /* ---- AI Generate Questions ---- */

  async function handleGenerateQuestions() {
    setAiQuestionsLoading(true);
    setAiQuestionsError("");

    const pinnedQuestions = quiz.questions.filter((q) => q.isPinned);
    const remaining = Math.max(1, questionCount - pinnedQuestions.length);

    try {
      const res = await fetch("/api/quiz-ai/generate-questions", {
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
          abstractness: quiz.abstractness,
          seriousness: quiz.seriousness,
          depth: quiz.depth,
          poeticness: quiz.poeticness,
          results: quiz.results.map((r) => ({
            key: r.id,
            name: r.name,
            subtitle: r.subtitle ?? "",
            description: r.description,
            traits: r.traits,
          })),
          factors: quiz.factors.map((f) => ({
            key: f.id,
            name: f.name,
            description: f.nameEn ?? "",
          })),
          result_vectors: Object.fromEntries(
            quiz.resultVectors.map((rv) => [rv.resultId, rv.values]),
          ),
          question_count: remaining,
          options_per_question: optionsPerQuestion,
          pinned_questions: pinnedQuestions.map((q) => ({
            text: q.text,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiQuestionsError(data.error ?? "AI 生成失败，请重试");
        return;
      }

      const aiQuestions = data.questions as {
        text: string;
        description?: string;
        options: {
          label: string;
          text: string;
          factor_effects: Record<string, number>;
        }[];
      }[];

      const newQuestions: Question[] = aiQuestions.map((q, qi) => ({
        id: `q_${Date.now()}_${qi}`,
        text: q.text,
        isPinned: false,
        options: q.options.map((opt) => ({
          label: opt.label,
          text: opt.text,
          effects: opt.factor_effects,
        })),
      }));

      setQuiz((prev) => ({
        ...prev,
        questions: [...pinnedQuestions, ...newQuestions],
      }));
      setQuestionIndex(0);
    } catch {
      setAiQuestionsError("网络错误，请检查连接后重试");
    } finally {
      setAiQuestionsLoading(false);
    }
  }

  /* ---- Render ---- */

  const { meta, results, factors, resultVectors, questions } = quiz;

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <TopNavbar />

        {/* Hero */}
        <section className="overflow-hidden rounded-[36px] border border-[var(--ink)]/8 bg-white p-6 shadow-[0_8px_30px_rgba(10,10,10,0.04)] sm:p-10">
          <p className="text-sm font-semibold text-[var(--muted)]">AI Quiz Studio</p>
          <h1 className="mt-2 text-4xl font-semibold leading-none tracking-[-0.04em] text-[var(--ink)] sm:text-5xl">
            AI Quiz Studio
          </h1>
          {isEditMode && (
            <p className="mt-2 text-sm font-medium text-[var(--muted)]">
              ✎ 编辑模式 — 正在编辑 Quiz
            </p>
          )}
          {editLoading && (
            <p className="mt-2 text-sm text-[var(--muted)]">加载编辑数据...</p>
          )}
          {editError && (
            <p className="mt-2 text-sm text-red-500">{editError}</p>
          )}
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--body)] sm:text-lg">
            用向量空间创建一个更稳定、更有解释力的人格测试。
          </p>

          {/* Action grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <button
              type="button"
              onClick={() => setMyQuizzesOpen(true)}
              className="group flex aspect-[4/3] items-center justify-center rounded-2xl border border-[var(--ink)]/10 bg-[var(--canvas)] transition-all hover:border-[var(--ink)]/25 hover:bg-[var(--ink)]/4 hover:shadow-[0_4px_16px_rgba(10,10,10,0.06)] active:scale-[0.98]"
            >
              <Library
                size={28}
                className="text-[var(--ink)] transition-transform group-hover:scale-110 sm:size-8"
              />
            </button>

            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-[var(--ink)]/6 bg-[var(--canvas)] opacity-50">
              <Sparkles size={28} className="text-[var(--muted)] sm:size-8" />
            </div>

            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-[var(--ink)]/6 bg-[var(--canvas)] opacity-50">
              <Wand size={28} className="text-[var(--muted)] sm:size-8" />
            </div>

            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-[var(--ink)]/6 bg-[var(--canvas)] opacity-50">
              <Settings size={28} className="text-[var(--muted)] sm:size-8" />
            </div>
          </div>
        </section>

        {/* My Quizzes Modal */}
        <MyQuizzesModal
          open={myQuizzesOpen}
          onClose={() => setMyQuizzesOpen(false)}
        />

        {/* Step 1: Quiz Meta */}
        <section className="space-y-4">
          <StepLabel num={1} label="测试基础信息" />
          <QuizMetaCard meta={meta} onChange={updateMeta} />
        </section>

        {/* Quiz Style Controls */}
        <QuizStyleControls
          style={{
            abstractness: quiz.abstractness,
            seriousness: quiz.seriousness,
            depth: quiz.depth,
            poeticness: quiz.poeticness,
          }}
          onChange={updateStyle}
        />

        {/* Step 2: Results */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <StepLabel num={2} label="结果人格" />
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
                "AI 生成"
              )}
            </button>
          </div>
          <div className="border-t border-[var(--ink)]/5 pt-4 pl-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <RangeSelector
                  min={4}
                  max={16}
                  value={resultCount}
                  onChange={setResultCount}
                />
              </div>
              <button
                type="button"
                onClick={addResult}
                className="inline-flex h-9 items-center gap-1 rounded-full bg-[var(--ink)]/6 px-4 text-sm font-semibold text-[var(--ink)] transition-all hover:bg-[var(--ink)]/12"
              >
                + 添加
              </button>
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--surface-card)] px-5 py-4 shadow-[0_8px_30px_rgba(10,10,10,0.04)]">
            <p className="text-sm leading-6 text-[var(--body)]">
              定义测试可能产生的结果人格，每个结果有独立的名称、描述和特质标签。
            </p>
          </div>
          {aiError && <p className="text-sm text-red-600">{aiError}</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result, i) => (
              <ResultCard
                key={result.id}
                result={result}
                index={i}
                onChange={(r) => updateResult(i, r)}
                onDelete={results.length > 1 ? () => deleteResult(i) : undefined}
                onTogglePin={() => togglePin(i)}
              />
            ))}
          </div>
        </section>

        {/* Step 3: Factors */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <StepLabel num={3} label="影响因子" />
            <button
              type="button"
              onClick={handleGenerateFactors}
              disabled={aiFactorsLoading}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_100%)] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(10,10,10,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(10,10,10,0.15)] disabled:opacity-50"
            >
              {aiFactorsLoading ? (
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
                "AI 生成"
              )}
            </button>
          </div>
          <div className="border-t border-[var(--ink)]/5 pt-4 pl-3">
            <div className="flex flex-wrap items-center gap-2">
              <RangeSelector
                min={4}
                max={16}
                value={factorCount}
                onChange={setFactorCount}
              />
            </div>
          </div>
          {aiFactorsError && (
            <p className="text-sm text-red-600">{aiFactorsError}</p>
          )}
          <FactorList
            factors={factors}
            onChange={updateFactor}
            onAdd={addFactor}
            onDelete={factors.length > 1 ? deleteFactor : undefined}
            onTogglePin={toggleFactorPin}
          />

          {showFactorPicker && (() => {
            const usedKeys = new Set(factors.map((f) => f.id));
            const available = SELFID_FACTORS.filter((sf) => !usedKeys.has(sf.key));
            if (available.length === 0) {
              return (
                <p className="mt-2 text-sm text-[var(--muted)]">所有 Selfid 因子已添加完毕。</p>
              );
            }
            return (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-[var(--surface-card)] p-4">
                <span className="w-full text-xs text-[var(--muted)]">从因子库中选择：</span>
                {available.map((sf) => (
                  <button
                    key={sf.key}
                    type="button"
                    onClick={() => selectFactor(sf.key)}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--ink)]/12"
                  >
                    {sf.name}
                    <span className="text-[10px] text-[var(--muted)]">
                      {sf.group === "core" ? "核心" : "社交"}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowFactorPicker(false)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--ink)] ml-1"
                >
                  取消
                </button>
              </div>
            );
          })()}
        </section>

        {/* Step 4: Result Vectors */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <StepLabel num={4} label="结果向量" />
            <button
              type="button"
              onClick={handleGenerateResultVectors}
              disabled={aiVectorsLoading}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_100%)] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(10,10,10,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(10,10,10,0.15)] disabled:opacity-50"
            >
              {aiVectorsLoading ? (
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
                "AI 生成"
              )}
            </button>
          </div>
          <div className="border-t border-[var(--ink)]/5 pt-4 pl-3" />
          {aiVectorsError && (
            <p className="text-sm text-red-600">{aiVectorsError}</p>
          )}
          <div className="rounded-2xl bg-[var(--surface-card)] px-5 py-4 shadow-[0_8px_30px_rgba(10,10,10,0.04)]">
            <p className="text-sm leading-6 text-[var(--body)]">
              为每个结果在每个因子维度上设定 0-100 的位置，构成该结果的人格向量。
            </p>
          </div>
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
                  onTogglePin={() => toggleResultVectorPin(rv.resultId)}
                />
              );
            })}
          </div>
        </section>

        {/* Step 5: Distance Validator */}
        <section className="space-y-4">
          <StepLabel num={5} label="结果区分度检查" />
          <div className="border-t border-[var(--ink)]/5 pt-4 pl-3" />
          <div className="rounded-2xl bg-[var(--surface-card)] px-5 py-4 shadow-[0_8px_30px_rgba(10,10,10,0.04)]">
            <p className="text-sm leading-6 text-[var(--body)]">
              基于欧氏距离计算结果向量之间的相似程度。相似度 &gt; 55% 表示两个人格位置较接近。
            </p>
          </div>
          <DistanceValidator
            resultVectors={resultVectors}
            results={results}
          />
        </section>

        {/* Step 6: Questions + Option Effects */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <StepLabel num={6} label="题目与选项影响" />
            <button
              type="button"
              onClick={handleGenerateQuestions}
              disabled={aiQuestionsLoading}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_100%)] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(10,10,10,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(10,10,10,0.15)] disabled:opacity-50"
            >
              {aiQuestionsLoading ? (
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
                "AI 生成"
              )}
            </button>
          </div>
          <div className="border-t border-[var(--ink)]/5 pt-4 pl-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <RangeSelector
                  min={4}
                  max={20}
                  value={questionCount}
                  onChange={setQuestionCount}
                />
                <span className="text-xs text-[var(--muted)]">题</span>
                <RangeSelector
                  min={2}
                  max={6}
                  value={optionsPerQuestion}
                  onChange={setOptionsPerQuestion}
                />
                <span className="text-xs text-[var(--muted)]">选</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  addQuestion();
                  setQuestionIndex(questions.length);
                }}
                className="inline-flex h-9 items-center gap-1 rounded-full bg-[var(--ink)]/6 px-4 text-sm font-semibold text-[var(--ink)] transition-all hover:bg-[var(--ink)]/12"
              >
                + 添加
              </button>
            </div>
          </div>
          {aiQuestionsError && (
            <p className="text-sm text-red-600">{aiQuestionsError}</p>
          )}
          <div className="rounded-2xl bg-[var(--surface-card)] px-5 py-4 shadow-[0_8px_30px_rgba(10,10,10,0.04)]">
            <p className="text-sm leading-6 text-[var(--body)]">
              每道题的每个选项都会在特定因子上产生增量效果，用户的最终向量是所有选项效果的累加。
            </p>
          </div>

          {questions.length > 0 && (
            <>
              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                  disabled={questionIndex === 0}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--ink)]/6 px-3 text-xs font-semibold text-[var(--ink)] transition-all hover:bg-[var(--ink)]/12 disabled:opacity-30"
                >
                  ← 上一题
                </button>

                <div className="flex items-center gap-1.5">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuestionIndex(i)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                        i === questionIndex
                          ? "bg-[var(--ink)] text-white shadow-sm"
                          : "bg-[var(--ink)]/6 text-[var(--muted)] hover:bg-[var(--ink)]/12 hover:text-[var(--ink)]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setQuestionIndex((i) => Math.min(questions.length - 1, i + 1))
                  }
                  disabled={questionIndex >= questions.length - 1}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--ink)]/6 px-3 text-xs font-semibold text-[var(--ink)] transition-all hover:bg-[var(--ink)]/12 disabled:opacity-30"
                >
                  下一题 →
                </button>
              </div>

              {/* Current question */}
              <QuestionEffectsCard
                key={questions[questionIndex]?.id}
                question={questions[questionIndex]}
                factors={factors}
                index={questionIndex}
                onChange={(updated) => updateQuestion(questionIndex, updated)}
                onDelete={
                  questions.length > 1
                    ? () => {
                        deleteQuestion(questionIndex);
                        setQuestionIndex((i) =>
                          Math.max(0, Math.min(i, questions.length - 2)),
                        );
                      }
                    : undefined
                }
                onTogglePin={() => toggleQuestionPin(questionIndex)}
              />
            </>
          )}
        </section>

        {/* Step 7: Coverage Validator */}
        <CoverageValidator questions={questions} factors={factors} />

        {/* Save */}
        <section className="flex flex-col items-center gap-4 pb-16 pt-8">
          {isEditMode && (
            <button
              type="button"
              onClick={() => router.push("/create")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink)]/12 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--muted)] transition-all hover:text-[var(--ink)] hover:border-[var(--ink)]/25"
            >
              ← 返回创建模式
            </button>
          )}
          <SaveQuizButton
            quiz={{
              meta,
              results,
              factors,
              resultVectors,
              questions,
              abstractness: quiz.abstractness,
              seriousness: quiz.seriousness,
              depth: quiz.depth,
              poeticness: quiz.poeticness,
            }}
            editMode={isEditMode}
            editQuizId={editQuizId}
          />
        </section>
      </div>
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--ink)]/15 border-t-[var(--ink)]/50" />
        </div>
      </main>
    }>
      <CreatePageContent />
    </Suspense>
  );
}
