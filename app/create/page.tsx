"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Library, CircleHelp, Check, AlertTriangle, AlertCircle, Minus, Sparkles } from "lucide-react";
import { Greeting } from "@/components/Greeting";
import { SlideOutTray } from "@/components/navigation/SlideOutTray";
import { QuizMetaCard } from "@/components/quiz-engine/QuizMetaCard";
import { QuizStyleControls } from "@/components/quiz-engine/QuizStyleControls";
import { ResultCard } from "@/components/quiz-engine/ResultCard";
import { FactorList } from "@/components/quiz-engine/FactorList";
import { ResultVectorCard } from "@/components/quiz-engine/ResultVectorCard";
import { QuestionEffectsCard } from "@/components/quiz-engine/QuestionEffectsCard";
import { SaveQuizButton } from "@/components/quiz-engine/SaveQuizButton";
import { MyQuizzesModal } from "@/components/quiz-runtime/MyQuizzesModal";
import { CreditPanel } from "@/components/quiz-studio/CreditPanel";
import { mapAIResults, DEFAULT_STYLE } from "@/lib/mock-quiz-engine";
import { validateResultDistances, validateQuestionCoverage } from "@/lib/quiz-vector";
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
/*  Nippon Colors — all from Nippon_Colors.md                          */
/* ------------------------------------------------------------------ */

const NIPPON_COLORS = [
  "#D7263D",
  "#C44536",
  "#A63D40",

  // Oranges
  "#E76F51",
  "#F08A4B",
  "#C97A40",

  // Yellows
  "#F4D35E",
  "#E9C46A",
  "#DDBB57",

  // Yellow Greens
  "#B8C480",
  "#A7C957",
  "#8FB339",

  // Greens
  "#5B8E55",
  "#4F8B67",
  "#2F6B4F",

  // Teals
  "#3A7D7C",
  "#2A9D8F",
  "#4D908E",

  // Cyans
  "#4EA8DE",
  "#48BFE3",
  "#5390D9",

  // Blues
  "#457B9D",
  "#3A5A98",
  "#1D4ED8",

  // Indigo
  "#5E60CE",
  "#4C5FD5",
  "#4361EE",

  // Purples
  "#6D597A",
  "#7B5EA7",
  "#8E6CBE",

  // Magentas
  "#B56576",
  "#C06C84",
  "#D17B88",

  // Pinks
  "#D98CA8",
  "#E5989B",
  "#F4A7B9",

  // Browns / Earth
  "#8D6E63",
  "#A47148",
  "#B08968",

  // Warm Neutrals
  "#D9CBB8",
  "#E6D5B8",
  "#F2E8CF",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const pool = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Color helpers                                                       */
/* ------------------------------------------------------------------ */

export function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function textOn(hex: string): string {
  return isLight(hex) ? "var(--ink)" : "#ffffff";
}

const SSR_DEFAULT_BG = "#DAC9A6"; // 鳥の子 — warm neutral for SSR

interface NipponTheme {
  heroBg: string;
  /** 7 step backgrounds + 1 for Style Controls */
  sectionBgs: string[];
  /** 12 colors for chips, effects, accents */
  accentColors: string[];
}

function useNipponTheme(): NipponTheme {
  const [theme, setTheme] = useState<NipponTheme>(() => ({
    heroBg: SSR_DEFAULT_BG,
    sectionBgs: Array.from({ length: 8 }, () => SSR_DEFAULT_BG),
    accentColors: Array.from({ length: 12 }, () => SSR_DEFAULT_BG),
  }));

  /* eslint-disable */
  useEffect(() => {
    setTheme({
      heroBg: pickRandom(NIPPON_COLORS),
      sectionBgs: Array.from({ length: 8 }, () => pickRandom(NIPPON_COLORS)),
      accentColors: pickN(NIPPON_COLORS, 12),
    });
  }, []);
  /* eslint-enable */

  return theme;
}

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
  title_relevance: number;
  goofiness: number;
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
/*  Step label — plain number + optional help popover                   */
/* ------------------------------------------------------------------ */

function StepLabel({ num, label, inverted, description }: {
  num: number;
  label: string;
  inverted?: boolean;
  description?: string;
}) {
  const textColor = inverted ? "text-white" : "text-[var(--ink)]";
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <span className={`shrink-0 text-xl font-semibold tracking-[-0.02em] ${textColor}`}>
        {num}
      </span>
      <h2 className={`text-xl font-semibold tracking-[-0.02em] ${textColor}`}>
        {label}
      </h2>
      {description && (
        <>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className={`shrink-0 rounded-full transition-opacity ${
              inverted ? "text-white/35 hover:text-white/65" : "text-[var(--ink)]/25 hover:text-[var(--ink)]/50"
            }`}
            title="查看说明"
          >
            <CircleHelp size={15} />
          </button>
          {helpOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setHelpOpen(false)} />
              <div className="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-sm bg-[var(--surface-card)] p-5 shadow-[0_12px_50px_rgba(10,10,10,0.15)] ring-1 ring-[var(--ink)]/6">
                <div className="border-t-2 border-dashed border-[var(--ink)]/10 pt-4">
                  <p className="text-sm leading-6 text-[var(--body)]">{description}</p>
                </div>
                <div className="border-t-2 border-dashed border-[var(--ink)]/10 mt-4 pt-3">
                  <button
                    type="button"
                    onClick={() => setHelpOpen(false)}
                    className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Range selector — compact, always black selected                    */
/* ------------------------------------------------------------------ */

function RangeSelector({
  min,
  max,
  value,
  onChange,
  disabledBelow,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  disabledBelow?: number;
}) {
  const options: number[] = [];
  for (let i = min; i <= max; i++) options.push(i);

  const disabledThreshold = disabledBelow ?? min;

  return (
    <span
      className="inline-flex items-center gap-px rounded-full p-px text-xs overflow-x-auto max-w-[260px] sm:max-w-[360px]"
      style={{ scrollbarWidth: "none", backgroundColor: "#fff" }}
    >
      {options.map((n) => {
        const disabled = n < disabledThreshold;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className="shrink-0 rounded-full px-2 py-0.5 font-semibold transition-colors transition-shadow disabled:cursor-not-allowed"
            style={
              value === n
                ? { backgroundColor: "var(--ink)", color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : disabled
                  ? { color: "var(--ink)", opacity: 0.25 }
                  : { color: "var(--ink)" }
            }
          >
            {n}
          </button>
        );
      })}
    </span>
  );
}

function AIGenerateBtn({ loading, onClick, inverted }: { loading: boolean; onClick: () => void; inverted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-[0_4px_14px_rgba(10,10,10,0.08)] transition-shadow hover:shadow-[0_8px_24px_rgba(10,10,10,0.15)] disabled:opacity-50 ${
        inverted ? "bg-white text-[var(--ink)]" : "bg-[var(--ink)] text-white"
      }`}
    >
      {loading ? (
        <>
          <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          AI 生成中...
        </>
      ) : (
        "AI 生成"
      )}
    </button>
  );
}

function AddBtn({ onClick, label, inverted }: { onClick: () => void; label: string; inverted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors transition-transform active:scale-95 ${
        inverted ? "bg-white/20 text-white hover:bg-white/30" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
      }`}
      title={label}
    >
      +
    </button>
  );
}

function StepDivider({ inverted }: { inverted?: boolean }) {
  return (
    <div
      className="border-t-2 border-dashed"
      style={{ borderColor: inverted ? "rgba(255,255,255,0.18)" : "var(--ink)" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editQuizId = searchParams.get("quiz_id");

  const theme = useNipponTheme();
  const [bgHero, bgS1, bgS2, bgS3, bgS4, , bgS6, , bgStyle] = [
    theme.heroBg,
    ...theme.sectionBgs,
  ];
  const { accentColors } = theme;

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

    // eslint-disable-next-line
    setEditLoading(true);
    setEditError("");

    fetch(`/api/quiz-studio/edit?quiz_id=${editQuizId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setEditError(data.error ?? "加载失败");
          return;
        }
        // Merge with DEFAULT_STYLE so new fields get defaults on old saved quizzes
        setQuiz({ ...DEFAULT_STYLE, ...data.quiz });
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
  const [resultIndex, setResultIndex] = useState(0);
  const [myQuizzesOpen, setMyQuizzesOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [showFactorPicker, setShowFactorPicker] = useState(false);
  const [discriminationOpen, setDiscriminationOpen] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [optionVectorEditor, setOptionVectorEditor] = useState<{ qIndex: number; oIndex: number } | null>(null);

  /* ---- Auto-correct count selectors when content exceeds current value ---- */
  /* eslint-disable */
  useEffect(() => {
    setResultCount((prev) => Math.max(prev, quiz.results.length));
  }, [quiz.results.length]);

  useEffect(() => {
    setFactorCount((prev) => Math.max(prev, quiz.factors.length));
  }, [quiz.factors.length]);

  useEffect(() => {
    setQuestionCount((prev) => Math.max(prev, quiz.questions.length));
  }, [quiz.questions.length]);
  /* eslint-enable */

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
      setResultIndex(prev.results.length); // jump to new result
      return {
        ...prev,
        results: [
          ...prev.results,
          { id, name: "", description: "", traits: [], isPinned: false, color: pickRandom(NIPPON_COLORS) },
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
    setResultIndex(0);

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
          result_count: Math.max(resultCount, quiz.results.length),
          abstractness: quiz.abstractness,
          seriousness: quiz.seriousness,
          depth: quiz.depth,
          poeticness: quiz.poeticness,
          existing_results: quiz.results.map((r) => ({
            key: r.id,
            name: r.name || undefined,
            subtitle: r.subtitle || undefined,
            description: r.description || undefined,
            traits: r.traits.length > 0 ? r.traits : undefined,
            share_text: r.shareText || undefined,
            image_url: r.image_url || undefined,
            color: r.color || undefined,
            is_pinned: r.isPinned,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error ?? "AI 生成失败，请重试");
        return;
      }

      const aiResults = data.results as AIResult[];
      const allResults = mapAIResults(aiResults).map((newResult) => {
        // Preserve image_url and color from existing result with the same key
        const existing = quiz.results.find((r) => r.id === newResult.id);
        if (!existing) {
          // New AI result — ensure it has a color
          if (!newResult.color) newResult.color = pickRandom(NIPPON_COLORS);
          return newResult;
        }
        const merged = { ...newResult };
        if (existing.image_url) merged.image_url = existing.image_url;
        if (existing.color) merged.color = existing.color;
        if (!merged.color) merged.color = pickRandom(NIPPON_COLORS);
        return merged;
      });

      setQuiz((prev) => {
        const pinnedIds = new Set(
          prev.results.filter((r) => r.isPinned).map((r) => r.id),
        );
        return {
          ...prev,
          results: allResults,
          resultVectors: allResults.map((r) => {
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
    const totalTarget = Math.max(factorCount, quiz.factors.length);
    const remaining = Math.max(1, totalTarget - pinnedFactors.length);

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
          title_relevance: quiz.title_relevance,
          goofiness: quiz.goofiness,
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
          question_count: Math.max(questionCount, quiz.questions.length),
          options_per_question: optionsPerQuestion,
          existing_questions: quiz.questions.map((q) => ({
            text: q.text || undefined,
            description: undefined,
            options: q.options.map((o) => ({
              label: o.label,
              text: o.text || undefined,
              factor_effects: Object.keys(o.effects).length > 0 ? o.effects : undefined,
            })),
            is_pinned: q.isPinned,
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

      const allQuestions: Question[] = aiQuestions.map((q, qi) => ({
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
        questions: allQuestions,
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

  // Determine inversion for each section
  const invHero = !isLight(bgHero);
  const inv2 = !isLight(bgS2);
  const inv3 = !isLight(bgS3);
  const inv4 = !isLight(bgS4);
  const inv6 = !isLight(bgS6);
  const invStyle = !isLight(bgStyle);

  /* ---- Discrimination status (Step 4 button) ---- */
  const discStatus = (() => {
    if (quiz.results.length < 2) return "gray" as const;
    const { pairs } = validateResultDistances(quiz.resultVectors, quiz.results);
    if (pairs.length === 0) return "gray" as const;
    const maxSim = Math.max(...pairs.map((p) => p.similarity));
    if (maxSim >= 85) return "red" as const;
    if (pairs.some((p) => p.close)) return "yellow" as const;
    return "green" as const;
  })();

  const DiscIcon = discStatus === "green" ? Check : discStatus === "yellow" ? AlertTriangle : discStatus === "red" ? AlertCircle : Minus;
  const discColor = discStatus === "green" ? "#22c55e" : discStatus === "yellow" ? "#f59e0b" : discStatus === "red" ? "#ef4444" : "#9ca3af";
  const discLabel =
    discStatus === "green" ? "区分度良好" : discStatus === "yellow" ? "部分结果较接近" : discStatus === "red" ? "区分度较差" : "结果不足";

  /* ---- Coverage status (Step 5 button) ---- */
  const covStatus = (() => {
    if (quiz.questions.length === 0 || quiz.factors.length === 0) return "gray" as const;
    const coverage = validateQuestionCoverage(quiz.questions, quiz.factors);
    const total = coverage.length;
    const covered = coverage.filter((c) => c.covered).length;
    if (total === 0) return "gray" as const;
    if (covered === total) return "green" as const;
    if (covered === 0) return "red" as const;
    return "yellow" as const;
  })();

  const CovIcon = covStatus === "green" ? Check : covStatus === "yellow" ? AlertTriangle : covStatus === "red" ? AlertCircle : Minus;
  const covColor = covStatus === "green" ? "#22c55e" : covStatus === "yellow" ? "#f59e0b" : covStatus === "red" ? "#ef4444" : "#9ca3af";
  const covLabel = covStatus === "green" ? "全部覆盖" : covStatus === "yellow" ? "部分覆盖不足" : covStatus === "red" ? "覆盖严重缺失" : "暂无数据";

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Greeting + Menu ── */}
        <div className="flex items-center justify-between -mb-2">
          <Greeting />
          <SlideOutTray />
        </div>

        {/* ── Hero ── */}
        <section
          className="overflow-hidden p-6 sm:p-8 shadow-[0_8px_30px_rgba(10,10,10,0.04)]"
          style={{ backgroundColor: bgHero, color: textOn(bgHero) }}
        >
          <div className="flex items-center justify-between">
            <h1 className={`text-4xl font-semibold leading-none tracking-[-0.04em] sm:text-5xl ${invHero ? "text-white" : "text-[var(--ink)]"}`}>
              Quiz Studio
            </h1>
            <button
              type="button"
              onClick={() => setCreditOpen(true)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors transition-transform active:scale-95 ${
                invHero ? "hover:bg-white/10 text-white" : "hover:bg-[var(--ink)]/8 text-[var(--ink)]"
              }`}
              title="Credits"
            >
              <Sparkles size={17} />
            </button>
            <button
              type="button"
              onClick={() => setMyQuizzesOpen(true)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors transition-transform active:scale-95 ${
                invHero ? "hover:bg-white/10 text-white" : "hover:bg-[var(--ink)]/8 text-[var(--ink)]"
              }`}
              title="创建过的 Quiz"
            >
              <Library size={20} />
            </button>
          </div>
          {isEditMode && (
            <p className={`mt-3 text-sm font-medium ${invHero ? "text-white/60" : "text-[var(--muted)]"}`}>
              ✎ 编辑模式 — 正在编辑 Quiz
            </p>
          )}
          {editLoading && (
            <p className={`mt-2 text-sm ${invHero ? "text-white/50" : "text-[var(--muted)]"}`}>加载编辑数据...</p>
          )}
          {editError && (
            <p className="mt-2 text-sm text-red-400">{editError}</p>
          )}
        </section>

        {/* My Quizzes Modal */}
        <MyQuizzesModal open={myQuizzesOpen} onClose={() => setMyQuizzesOpen(false)} />

        {/* Credit Panel */}
        <CreditPanel open={creditOpen} onClose={() => setCreditOpen(false)} />

        {/* ── Step 1: Quiz Meta — QuizMetaCard IS the step card */}
        <QuizMetaCard
          meta={meta}
          onChange={updateMeta}
          bgColor={bgS1}
          stepNumber={1}
          stepLabel="测试基础信息"
          stepDescription="这是创建测试的起点。输入标题、副标题，并设定目标受众与语气风格。标题是整个测试的主题锚点——AI 在生成结果人格时会严格围绕标题主题命名（例如「你是哪种猫」→ 橘猫、布偶猫，而非泛泛的性格标签）。受众和语气则影响所有 AI 生成内容的表达方式。"
        />

        {/* ── Step 2: Results ── */}
        <motion.section
          className="overflow-hidden p-5 sm:p-6 space-y-4"
          initial={{ opacity: 0, scale: 0.90 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
          style={{ backgroundColor: bgS2, color: textOn(bgS2) }}
        >
          <div className="flex items-center justify-between">
            <StepLabel num={2} label="结果人格" inverted={inv2} description="AI 根据 Step 1 的标题、副标题、受众和语气，自动生成多种结果人格。每个结果包含名称、副标题、人格描述和特质标签（traits）。标题决定了结果的「类型范畴」——例如「你是哪种猫」会生成橘猫、布偶猫等具体品种，而非泛化的性格标签。你可以手动修改、删除或点击 📌 固定任意结果；固定后的结果在下次 AI 生成时不会被覆盖。" />
            <AIGenerateBtn loading={aiLoading} onClick={handleGenerateResults} inverted={inv2} />
          </div>
          <StepDivider inverted={inv2} />
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <RangeSelector min={4} max={16} value={resultCount} onChange={setResultCount} disabledBelow={results.length} />
            </div>
            <AddBtn onClick={addResult} label="添加" inverted={inv2} />
          </div>
          {aiError && <p className="text-sm text-red-400">{aiError}</p>}

          {results.length > 0 && (
            <>
              {/* Result Navigation */}
              <div className="flex items-center gap-1">
                <button type="button"
                  onClick={() => setResultIndex((i) => Math.max(0, i - 1))}
                  disabled={resultIndex === 0}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors disabled:opacity-20 ${
                    inv2 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                  }`}
                >
                  ←
                </button>

                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {results.map((_, i) => (
                    <button key={i} type="button" onClick={() => setResultIndex(i)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold leading-none transition-colors"
                      style={
                        i === resultIndex
                          ? { backgroundColor: "var(--ink)", color: "#fff" }
                          : inv2
                            ? { backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }
                            : { backgroundColor: "var(--ink)", opacity: 0.06, color: "var(--muted)" }
                      }
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button type="button"
                  onClick={() => setResultIndex((i) => Math.min(results.length - 1, i + 1))}
                  disabled={resultIndex >= results.length - 1}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors disabled:opacity-20 ${
                    inv2 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                  }`}
                >
                  →
                </button>
              </div>

              {/* Current Result */}
              {(() => {
                const i = Math.min(resultIndex, results.length - 1);
                const result = results[i];
                if (!result) return null;
                return (
                  <ResultCard key={result.id} result={result}
                    onChange={(r) => updateResult(i, r)}
                    onDelete={results.length > 1 ? () => { deleteResult(i); setResultIndex((idx) => Math.max(0, Math.min(idx, results.length - 2))); } : undefined}
                    onTogglePin={() => togglePin(i)}
                    cardColor={result.color}
                  />
                );
              })()}
            </>
          )}
        </motion.section>

        {/* ── Step 3: Factors ── */}
        <motion.section
          className="overflow-hidden p-5 sm:p-6 space-y-4"
          initial={{ opacity: 0, scale: 0.90 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
          style={{ backgroundColor: bgS3, color: textOn(bgS3) }}
        >
          <div className="flex items-center justify-between">
            <StepLabel num={3} label="影响因子" inverted={inv3} description="AI 根据 Step 1 的标题和 Step 2 的结果人格列表，从 16 维 SelfID 因子库中自动挑选最能「拉开差距」的因子。一个好的因子应该让不同的结果在该维度上呈现明显的高低差异——如果所有结果在某个因子上得分相近，这个因子就缺乏区分力。你也可以从因子库中手动添加，或删除不需要的因子。" />
            <AIGenerateBtn loading={aiFactorsLoading} onClick={handleGenerateFactors} inverted={inv3} />
          </div>
          <StepDivider inverted={inv3} />
          <div className="flex flex-wrap items-center gap-2">
            <RangeSelector min={4} max={16} value={factorCount} onChange={setFactorCount} disabledBelow={factors.length} />
          </div>
          {aiFactorsError && <p className="text-sm text-red-400">{aiFactorsError}</p>}
          <FactorList
            factors={factors}
            onChange={updateFactor}
            onAdd={addFactor}
            onDelete={factors.length > 1 ? deleteFactor : undefined}
            onTogglePin={toggleFactorPin}
            noCard
          />

          {showFactorPicker && (() => {
            const usedKeys = new Set(factors.map((f) => f.id));
            const available = SELFID_FACTORS.filter((sf) => !usedKeys.has(sf.key));
            if (available.length === 0) {
              return <p className={`text-sm ${inv3 ? "text-white/50" : "text-[var(--muted)]"}`}>所有 Selfid 因子已添加完毕。</p>;
            }
            return (
              <div className={`flex flex-wrap items-center gap-2 rounded-2xl p-4 ${inv3 ? "bg-white/10" : "bg-[var(--ink)]/5"}`}>
                <span className={`w-full text-xs ${inv3 ? "text-white/50" : "text-[var(--muted)]"}`}>从因子库中选择：</span>
                {available.map((sf) => (
                  <button key={sf.key} type="button" onClick={() => selectFactor(sf.key)}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--ink)]/12"
                  >
                    {sf.name}
                    <span className="text-[10px] text-[var(--muted)]">{sf.group === "core" ? "核心" : "社交"}</span>
                  </button>
                ))}
                <button type="button" onClick={() => setShowFactorPicker(false)}
                  className={`ml-1 text-xs ${inv3 ? "text-white/50 hover:text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                >
                  取消
                </button>
              </div>
            );
          })()}
        </motion.section>

        {/* ── Step 4: Result Vectors ── */}
        <motion.section
          className="overflow-hidden p-5 sm:p-6 space-y-4"
          initial={{ opacity: 0, scale: 0.90 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
          style={{ backgroundColor: bgS4, color: textOn(bgS4) }}
        >
          <div className="flex items-center justify-between">
            <StepLabel num={4} label="结果向量" inverted={inv4} description="AI 将 Step 2 每个结果人格的 traits（特质标签）和 description（描述）作为首要依据，在 Step 3 的每个因子维度上分配 0-100 的数值，构成该结果的人格向量。AI 会确保每个结果都有明显的高低差异（至少 2 个因子偏高、2 个因子偏低），且不同结果在同一条因子上保持足够差距（≥15 分）。右上角的指示灯按钮可以检查区分度——如果两个结果的向量过于接近，说明它们在测试中无法被有效区隔。" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDiscriminationOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: `${discColor}20`, color: discColor }}
                title={discLabel}
              >
                <DiscIcon size={15} />
              </button>
              <AIGenerateBtn loading={aiVectorsLoading} onClick={handleGenerateResultVectors} inverted={inv4} />
            </div>
          </div>
          <StepDivider inverted={inv4} />
          {aiVectorsError && <p className="text-sm text-red-400">{aiVectorsError}</p>}
          {(() => {
            // Build aligned list: resultVectors in same order as results
            const aligned = results.map((r) => {
              const rv = resultVectors.find((v) => v.resultId === r.id);
              return rv ? { result: r, vector: rv } : null;
            }).filter(Boolean) as { result: typeof results[number]; vector: ResultVector }[];

            if (aligned.length === 0) return null;

            const i = Math.min(resultIndex, aligned.length - 1);
            const { result, vector } = aligned[i];
            const colorIdx = results.findIndex((r) => r.id === result.id);

            return (
              <>
                {/* Vector Navigation — synced with resultIndex */}
                <div className="flex items-center justify-between">
                  <button type="button"
                    onClick={() => setResultIndex((idx) => Math.max(0, idx - 1))}
                    disabled={resultIndex === 0}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors disabled:opacity-20 ${
                      inv4 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                    }`}
                  >
                    ←
                  </button>

                  <span className={`text-sm font-semibold ${inv4 ? "text-white/70" : "text-[var(--muted)]"}`}>
                    {result.name}
                  </span>

                  <button type="button"
                    onClick={() => setResultIndex((idx) => Math.min(aligned.length - 1, idx + 1))}
                    disabled={resultIndex >= aligned.length - 1}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors disabled:opacity-20 ${
                      inv4 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                    }`}
                  >
                    →
                  </button>
                </div>

                <ResultVectorCard
                  key={result.id}
                  result={result}
                  vector={vector}
                  factors={factors}
                  index={colorIdx}
                  onValueChange={(factorId, value) => updateResultVectorValue(result.id, factorId, value)}
                  onTogglePin={() => toggleResultVectorPin(result.id)}
                  accentColor={result.color || "#DAC9A6"}
                />
              </>
            );
          })()}
        </motion.section>

        {/* ── Quiz Style Controls ── */}
        <motion.section
          className="overflow-hidden p-5 sm:p-6 space-y-4"
          initial={{ opacity: 0, scale: 0.90 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
          style={{ backgroundColor: bgStyle, color: textOn(bgStyle) }}
        >
          <QuizStyleControls
            style={{ abstractness: quiz.abstractness, seriousness: quiz.seriousness, depth: quiz.depth, poeticness: quiz.poeticness, title_relevance: quiz.title_relevance, goofiness: quiz.goofiness }}
            onChange={updateStyle}
            inverted={invStyle}
            description="这 6 个滑块专门控制 Step 5 题目 AI 生成时的写作风格（不影响 Step 2 结果人格和 Step 4 结果向量的 AI 生成）。每个参数 0-100 分为 5 个策略档位，AI 会匹配对应的行为指令：抽象度决定场景是日常具体还是隐喻想象；严肃度决定语气是轻松随意还是正式严谨；搞怪度控制内容的趣味性和反套路程度；深度决定问题是表面偏好还是深层价值观；文艺度控制语言是直白朴素还是抒情诗意；主题相关度决定题目与标题主题的绑定强度。"
          />
        </motion.section>

        {/* ── Step 5: Questions ── */}
        <motion.section
          className="overflow-hidden p-5 sm:p-6 space-y-4"
          initial={{ opacity: 0, scale: 0.90 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
          style={{ backgroundColor: bgS6, color: textOn(bgS6) }}
        >
          <div className="flex items-center justify-between">
            <StepLabel num={5} label="题目" inverted={inv6} description="AI 综合前面所有步骤的内容生成题目：Step 1 的标题/元信息决定主题方向，Step 2 的结果人格是需要区分的「目标画像」，Step 3 的因子定义了测量维度，Step 4 的结果向量标明了每个结果在各因子上的理想位置，上方风格偏好的 6 个参数控制写作风格。每个选项在特定因子上产生 -3 到 +3 的增量效果（factor_effects）；用户答题时这些效果逐步累加形成用户向量，最终与 Step 4 的结果向量做欧几里得距离匹配，计算出最相似的结果人格。右上角的指示灯按钮可以检查因子覆盖——确保每个因子都被至少一道题目测量到。" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCoverageOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: `${covColor}20`, color: covColor }}
                title={covLabel}
              >
                <CovIcon size={15} />
              </button>
              <AIGenerateBtn loading={aiQuestionsLoading} onClick={handleGenerateQuestions} inverted={inv6} />
            </div>
          </div>
          <StepDivider inverted={inv6} />
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <RangeSelector min={4} max={20} value={questionCount} onChange={setQuestionCount} disabledBelow={questions.length} />
              <span className={`text-[10px] ${inv6 ? "text-white/50" : "text-[var(--muted)]"}`}>题</span>
              <RangeSelector min={2} max={6} value={optionsPerQuestion} onChange={setOptionsPerQuestion} />
              <span className={`text-[10px] ${inv6 ? "text-white/50" : "text-[var(--muted)]"}`}>选</span>
            </div>
            <AddBtn
              onClick={() => { addQuestion(); setQuestionIndex(questions.length); }}
              label="添加" inverted={inv6}
            />
          </div>
          {aiQuestionsError && <p className="text-sm text-red-400">{aiQuestionsError}</p>}
          {questions.length > 0 && (
            <>
              {/* Navigation */}
              <div className="flex items-center gap-1">
                <button type="button"
                  onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                  disabled={questionIndex === 0}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors disabled:opacity-20 ${
                    inv6 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                  }`}
                >
                  ←
                </button>

                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {questions.map((_, i) => (
                    <button key={i} type="button" onClick={() => setQuestionIndex(i)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold leading-none transition-colors"
                      style={
                        i === questionIndex
                          ? { backgroundColor: "var(--ink)", color: "#fff" }
                          : inv6
                            ? { backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }
                            : { backgroundColor: "var(--ink)", opacity: 0.06, color: "var(--muted)" }
                      }
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button type="button"
                  onClick={() => setQuestionIndex((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={questionIndex >= questions.length - 1}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors disabled:opacity-20 ${
                    inv6 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                  }`}
                >
                  →
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
                    ? () => { deleteQuestion(questionIndex); setQuestionIndex((i) => Math.max(0, Math.min(i, questions.length - 2))); }
                    : undefined
                }
                onTogglePin={() => toggleQuestionPin(questionIndex)}
                onOptionVectorClick={(oIndex) => setOptionVectorEditor({ qIndex: questionIndex, oIndex })}
              />
            </>
          )}
        </motion.section>

        {/* ── Save ── */}
        <section className="flex flex-col items-center gap-4 pb-16 pt-8">
          {isEditMode && (
            <button type="button" onClick={() => router.push("/create")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink)]/12 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)] hover:border-[var(--ink)]/25"
            >
              ← 返回创建模式
            </button>
          )}
          <SaveQuizButton
            quiz={{ meta, results, factors, resultVectors, questions, abstractness: quiz.abstractness, seriousness: quiz.seriousness, depth: quiz.depth, poeticness: quiz.poeticness, title_relevance: quiz.title_relevance, goofiness: quiz.goofiness }}
            editMode={isEditMode}
            editQuizId={editQuizId}
            accentColor={undefined}
          />
        </section>
      </div>
      {/* ── Discrimination Modal ── */}
      {discriminationOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setDiscriminationOpen(false)} />

          {/* Sheet */}
          <div className="relative z-10 w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-[var(--surface-card)] p-6 shadow-[0_-8px_40px_rgba(10,10,10,0.12)] sm:m-4">
            {/* Close handle */}
            <div className="flex justify-center mb-4 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-[var(--ink)]/15" />
            </div>

            {/* Content: discrimination check results */}
            {(() => {
              const { pairs } = validateResultDistances(quiz.resultVectors, quiz.results);
              if (pairs.length === 0) {
                return (
                  <p className="text-sm text-[var(--muted)] text-center py-8">
                    至少需要 2 个结果才能检查区分度。
                  </p>
                );
              }
              const closePairs = pairs.filter((p) => p.close);
              const distinctPairs = pairs.filter((p) => !p.close);

              return (
                <div className="space-y-5">
                  {closePairs.length > 0 && (
                    <div className="space-y-0">
                      <p className="text-sm font-semibold text-[var(--muted)] mb-3">距离较近的结果对（可能存在相似输出）</p>
                      {closePairs.map((pair) => (
                        <div key={`${pair.resultA.id}-${pair.resultB.id}`} className="border-b border-dashed border-[var(--ink)]/10 py-3 last:border-b-0 last:pb-0">
                          <p className="text-sm leading-6 text-[var(--muted)]">
                            <span className="font-semibold text-[var(--ink)]">{pair.resultA.name}</span>
                            {" 和 "}
                            <span className="font-semibold text-[var(--ink)]">{pair.resultB.name}</span>
                            {" 人格位置较接近（相似度 "}
                            <span className="font-semibold text-[var(--ink)]">{pair.similarity}%</span>
                            {"），可能会产生相似结果。"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {distinctPairs.length > 0 && (
                    <div className="space-y-0">
                      <p className="text-sm font-semibold text-[var(--muted)] mb-3">区分度良好的结果对</p>
                      {distinctPairs.map((pair) => (
                        <div key={`${pair.resultA.id}-${pair.resultB.id}`} className="border-b border-dashed border-[var(--ink)]/10 py-3 last:border-b-0 last:pb-0">
                          <p className="text-sm leading-6 text-[var(--muted)]">
                            <span className="font-semibold text-[var(--ink)]">{pair.resultA.name}</span>
                            {" 和 "}
                            <span className="font-semibold text-[var(--ink)]">{pair.resultB.name}</span>
                            {" 区分度良好（相似度 "}
                            <span className="font-semibold text-[var(--ink)]">{pair.similarity}%</span>
                            {"）。"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Close button */}
            <button
              type="button"
              onClick={() => setDiscriminationOpen(false)}
              className="mt-5 w-full rounded-full bg-[var(--ink)]/6 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)]/12"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* ── Coverage Modal ── */}
      {coverageOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCoverageOpen(false)} />

          <div className="relative z-10 w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-[var(--surface-card)] p-6 shadow-[0_-8px_40px_rgba(10,10,10,0.12)] sm:m-4">
            <div className="flex justify-center mb-4 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-[var(--ink)]/15" />
            </div>

            {(() => {
              if (quiz.questions.length === 0 || quiz.factors.length === 0) {
                return (
                  <p className="text-sm text-[var(--muted)] text-center py-8">
                    暂无题目或因子数据，无法检查覆盖情况。
                  </p>
                );
              }
              const coverage = validateQuestionCoverage(quiz.questions, quiz.factors);

              return (
                <div className="space-y-5">
                  <div className="space-y-0">
                    {coverage.map((item) => (
                      <div key={item.factor.id} className="flex items-center justify-between py-3 border-b border-dashed border-[var(--ink)]/10 last:border-b-0">
                        <div className="flex items-center gap-3">
                          {item.covered ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 text-green-500">
                              <circle cx="10" cy="10" r="9" fill="currentColor" />
                              <path d="M6.5 10.5l2 2 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 text-red-400">
                              <circle cx="10" cy="10" r="9" fill="currentColor" />
                              <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          )}
                          <span className="text-sm font-semibold text-[var(--ink)]">{item.factor.name}</span>
                        </div>
                        <span className={`text-sm font-semibold ${item.covered ? 'text-green-600' : 'text-red-400'}`}>
                          {item.covered ? "已覆盖" : "未覆盖"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {coverage.some((c) => !c.covered) && (
                    <div className="rounded-[20px] p-4 bg-[var(--ink)]/5">
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {coverage.filter((c) => !c.covered).map((c) => `"${c.factor.name}"`).join("、")}
                        目前没有被任何题目测量。
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            <button
              type="button"
              onClick={() => setCoverageOpen(false)}
              className="mt-5 w-full rounded-full bg-[var(--ink)]/6 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)]/12"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* ── Option Vector Editor Modal ── */}
      {optionVectorEditor && (() => {
        const q = quiz.questions[optionVectorEditor.qIndex];
        if (!q) return null;
        const opt = q.options[optionVectorEditor.oIndex];
        if (!opt) return null;

        const handleEffectChange = (factorId: string, value: number) => {
          const clamped = Math.max(-5, Math.min(5, value));
          const updatedOptions = q.options.map((o, i) =>
            i === optionVectorEditor.oIndex
              ? { ...o, effects: { ...o.effects, [factorId]: clamped } }
              : o
          );
          updateQuestion(optionVectorEditor.qIndex, { ...q, options: updatedOptions });
        };

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setOptionVectorEditor(null)} />

            <div className="relative z-10 w-full max-w-lg max-h-[75vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] bg-[var(--surface-card)] p-6 shadow-[0_-8px_40px_rgba(10,10,10,0.12)] sm:m-4">
              <div className="flex justify-center mb-4 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-[var(--ink)]/15" />
              </div>

              <p className="text-sm font-semibold text-[var(--muted)] mb-4">
                选项 {opt.label} · 因子效果
              </p>

              <div className="space-y-4">
                {factors.map((f) => {
                  const val = opt.effects[f.id] ?? 0;
                  const pct = ((val + 5) / 10) * 100; // -5→0%, 0→50%, +5→100%
                  const efIdx = factors.findIndex((x) => x.id === f.id);
                  const efColor = accentColors?.[efIdx % (accentColors?.length || 1)] ?? "#b8a4ed";
                  const r = parseInt(efColor.slice(1, 3), 16);
                  const g = parseInt(efColor.slice(3, 5), 16);
                  const b = parseInt(efColor.slice(5, 7), 16);
                  const isLight = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
                  const tc = isLight ? "#1a1a1a" : "#ffffff";
                  const mutedText = isLight ? "rgba(10,10,10,0.55)" : "rgba(255,255,255,0.65)";
                  return (
                    <div key={f.id} className="rounded-[20px] p-4" style={{ backgroundColor: efColor }}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold shrink-0 w-20 truncate" style={{ color: tc }}>{f.name}</span>
                        <input
                          type="range"
                          min={-5}
                          max={5}
                          step={1}
                          value={val}
                          onChange={(e) => handleEffectChange(f.id, parseInt(e.target.value, 10))}
                          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${tc} 0%, ${tc} ${pct}%, ${mutedText} ${pct}%, ${mutedText} 100%)`,
                            accentColor: tc,
                          }}
                        />
                        <span className="text-sm font-bold tabular-nums shrink-0 w-7 text-right" style={{ color: val === 0 ? mutedText : tc }}>
                          {val > 0 ? `+${val}` : `${val}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setOptionVectorEditor(null)}
                className="mt-5 w-full rounded-full bg-[var(--ink)]/6 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)]/12"
              >
                关闭
              </button>
            </div>
          </div>
        );
      })()}

        {/* Toast — credit remaining after AI generation */}
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
