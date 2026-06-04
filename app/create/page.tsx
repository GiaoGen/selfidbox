"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Library, CircleHelp } from "lucide-react";
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
/*  Nippon Colors — all from Nippon_Colors.md                          */
/* ------------------------------------------------------------------ */

const NIPPON_COLORS = [
  "#DC9FB4","#E16B8C","#8E354A","#F8C3CD","#F4A7B9","#64363C","#F596AA","#B5495B","#E87A90","#D05A6E",
  "#DB4D6D","#FEDFE1","#9E7A7A","#D0104C","#9F353A","#CB1B45","#EEA9A9","#BF6766","#86473F","#B19693",
  "#EB7A77","#954A45","#A96360","#CB4042","#AB3B3A","#D7C4BB","#904840","#734338","#C73E3A","#554236",
  "#994639","#F19483","#B54434","#B9887D","#F17C67","#884C3A","#E83015","#D75455","#B55D4C","#854836",
  "#A35E47","#CC543A","#724832","#F75C2F","#6A4028","#9A5034","#C46243","#AF5F3C","#FB966E","#724938",
  "#B47157","#DB8E71","#F05E1C","#ED784A","#CA7853","#B35C37","#563F2E","#E3916E","#8F5A3C","#F0A986",
  "#A0674B","#C1693C","#FB9966","#947A6D","#A36336","#E79460","#7D532C","#C78550","#985F2A","#E1A679",
  "#855B32","#FC9F4D","#FFBA84","#E98B2A","#E9A368","#B17844","#96632E","#43341B","#CA7A2C","#ECB88A",
  "#78552B","#B07736","#967249","#E2943B","#C7802D","#9B6E23","#6E552F","#EBB471","#D7B98E","#82663A",
  "#B68E55","#BC9F77","#876633","#C18A26","#FFB11B","#D19826","#DDA52D","#C99833","#F9BF45","#DCB879",
  "#BA9132","#E8B647","#F7C242","#7D6C46","#DAC9A6","#FAD689","#D9AB42","#F6C555","#FFC408","#EFBB24",
  "#CAAD5F","#8D742A","#B4A582","#877F6C","#897D55","#74673E","#A28C37","#6C6024","#867835","#62592C",
  "#E9CD4C","#F7D94C","#FBE251","#D9CD90","#ADA142","#DDD23B","#A5A051","#BEC23F","#6C6A2D","#939650",
  "#838A2D","#B1B479","#616138","#4B4E2A","#5B622E","#4D5139","#89916B","#90B44B","#91AD70","#B5CAA0",
  "#646A58","#7BA23F","#86C166","#4A593D","#42602D","#516E41","#91B493","#808F7C","#1B813E","#5DAC81",
  "#36563C","#227D51","#A8D8B9","#6A8372","#2D6D4B","#465D4C","#24936E","#86A697","#00896C","#096148",
  "#20604F","#0F4C3A","#4F726C","#00AA90","#69B0AC","#26453D","#66BAB7","#268785","#405B55","#305A56",
  "#78C2C4","#376B6D","#A5DEE4","#77969A","#6699A1","#81C7D4","#33A6B8","#0C4842","#0D5661","#0089A7",
  "#336774","#255359","#1E88A8","#566C73","#577C8A","#58B2DC","#2B5F75","#3A8FB7","#2E5C6E","#006284",
  "#7DB9DE","#51A8DD","#2EA9DF","#0B1013","#0F2540","#08192D","#005CAF","#0B346E","#7B90D2","#6E75A4",
  "#261E47","#113285","#4E4F97","#211E55","#8B81C3","#70649A","#9B90C2","#8A6BBE","#6A4C9C","#8F77B5",
  "#533D5B","#B28FCE","#986DB2","#77428D","#3C2F41","#4A225D","#66327C","#592C63","#6F3381","#574C57",
  "#B481BB","#3F2B36","#572A3F","#5E3D50","#72636E","#622954","#6D2E5B","#C1328E","#A8497A","#562E37",
  "#E03C8A","#60373E","#FCFAF2","#FFFFFB","#BDC0BA","#91989F","#787878","#828282","#787D7B","#707C74",
  "#656765","#535953","#4F4F48","#52433D","#373C38","#3A3226","#434343","#1C1C1C","#080808","#0C0C0C",
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

function subtleOn(hex: string): string {
  return isLight(hex) ? "var(--muted)" : "rgba(255,255,255,0.65)";
}

const SSR_DEFAULT_BG = "#DAC9A6"; // 鳥の子 — warm neutral for SSR

interface NipponTheme {
  heroBg: string;
  /** 7 step backgrounds + 1 for Style Controls */
  sectionBgs: string[];
  /** 8 colors for result cards */
  resultColors: string[];
  /** 12 colors for chips, effects, accents */
  accentColors: string[];
}

function useNipponTheme(): NipponTheme {
  const [theme, setTheme] = useState<NipponTheme>(() => ({
    heroBg: SSR_DEFAULT_BG,
    sectionBgs: Array.from({ length: 8 }, () => SSR_DEFAULT_BG),
    resultColors: Array.from({ length: 8 }, () => SSR_DEFAULT_BG),
    accentColors: Array.from({ length: 12 }, () => SSR_DEFAULT_BG),
  }));

  useEffect(() => {
    setTheme({
      heroBg: pickRandom(NIPPON_COLORS),
      sectionBgs: Array.from({ length: 8 }, () => pickRandom(NIPPON_COLORS)),
      resultColors: pickN(NIPPON_COLORS, 8),
      accentColors: pickN(NIPPON_COLORS, 12),
    });
  }, []);

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
              <div className="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl bg-[var(--surface-card)] p-5 shadow-[0_12px_50px_rgba(10,10,10,0.15)] ring-1 ring-[var(--ink)]/6">
                <p className="text-sm leading-6 text-[var(--body)]">{description}</p>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className="mt-3 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                >
                  关闭
                </button>
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
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  inverted?: boolean;
}) {
  const options: number[] = [];
  for (let i = min; i <= max; i++) options.push(i);

  return (
    <span
      className="inline-flex items-center gap-px rounded-full p-px text-[10px] overflow-x-auto max-w-[220px] sm:max-w-[300px]"
      style={{ scrollbarWidth: "none", backgroundColor: "#fff" }}
    >
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="shrink-0 rounded-full px-1.5 py-0 font-semibold transition-all"
          style={
            value === n
              ? { backgroundColor: "var(--ink)", color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
              : { color: "var(--ink)" }
          }
        >
          {n}
        </button>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared sub-components for Step sections                             */
/* ------------------------------------------------------------------ */

function StepSection({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  const light = isLight(bg);
  return (
    <section
      className="overflow-hidden rounded-[28px] p-5 sm:p-6 space-y-4"
      style={{ backgroundColor: bg, color: light ? "var(--ink)" : "#ffffff" }}
    >
      {children}
    </section>
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
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all active:scale-95 ${
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
      className="border-t"
      style={{ borderColor: inverted ? "rgba(255,255,255,0.12)" : "var(--ink)" }}
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
  const [bgHero, bgS1, bgS2, bgS3, bgS4, bgS5, bgS6, bgS7, bgStyle] = [
    theme.heroBg,
    ...theme.sectionBgs,
  ];
  const { resultColors, accentColors } = theme;

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
  const [resultIndex, setResultIndex] = useState(0);
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
      setResultIndex(prev.results.length); // jump to new result
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
    setResultIndex(0);

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

  // Determine inversion for each section
  const invHero = !isLight(bgHero);
  const inv1 = !isLight(bgS1);
  const inv2 = !isLight(bgS2);
  const inv3 = !isLight(bgS3);
  const inv4 = !isLight(bgS4);
  const inv5 = !isLight(bgS5);
  const inv6 = !isLight(bgS6);
  const inv7 = !isLight(bgS7);
  const invStyle = !isLight(bgStyle);

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <TopNavbar />

        {/* ── Hero ── */}
        <section
          className="overflow-hidden rounded-[36px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(10,10,10,0.04)]"
          style={{ backgroundColor: bgHero, color: textOn(bgHero) }}
        >
          <div className="flex items-center justify-between">
            <h1 className={`text-4xl font-semibold leading-none tracking-[-0.04em] sm:text-5xl ${invHero ? "text-white" : "text-[var(--ink)]"}`}>
              AI Quiz Studio
            </h1>
            <button
              type="button"
              onClick={() => setMyQuizzesOpen(true)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 ${
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

        {/* ── Step 1: Quiz Meta — QuizMetaCard IS the step card */}
        <QuizMetaCard
          meta={meta}
          onChange={updateMeta}
          bgColor={bgS1}
          stepNumber={1}
          stepLabel="测试基础信息"
        />

        {/* ── Quiz Style Controls ── */}
        <section
          className="overflow-hidden rounded-[28px] p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: bgStyle, color: textOn(bgStyle) }}
        >
          <QuizStyleControls
            style={{ abstractness: quiz.abstractness, seriousness: quiz.seriousness, depth: quiz.depth, poeticness: quiz.poeticness }}
            onChange={updateStyle}
            accentColor={undefined}
            inverted={invStyle}
          />
        </section>

        {/* ── Step 2: Results ── */}
        <section
          className="overflow-hidden rounded-[28px] p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: bgS2, color: textOn(bgS2) }}
        >
          <div className="flex items-center justify-between">
            <StepLabel num={2} label="结果人格" inverted={inv2} description="定义测试可能产生的结果人格，每个结果有独立的名称、描述和特质标签。" />
            <AIGenerateBtn loading={aiLoading} onClick={handleGenerateResults} inverted={inv2} />
          </div>
          <StepDivider inverted={inv2} />
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <RangeSelector min={4} max={16} value={resultCount} onChange={setResultCount} inverted={inv2} />
            </div>
            <AddBtn onClick={addResult} label="添加" inverted={inv2} />
          </div>
          {aiError && <p className="text-sm text-red-400">{aiError}</p>}

          {results.length > 0 && (
            <>
              {/* Result Navigation */}
              <div className="flex items-center justify-between">
                <button type="button"
                  onClick={() => setResultIndex((i) => Math.max(0, i - 1))}
                  disabled={resultIndex === 0}
                  className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-all disabled:opacity-30 ${
                    inv2 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                  }`}
                >
                  ← 上一个
                </button>

                <div className="flex items-center gap-1.5">
                  {results.map((_, i) => (
                    <button key={i} type="button" onClick={() => setResultIndex(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all"
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
                  className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-all disabled:opacity-30 ${
                    inv2 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                  }`}
                >
                  下一个 →
                </button>
              </div>

              {/* Current Result */}
              {(() => {
                const i = Math.min(resultIndex, results.length - 1);
                const result = results[i];
                if (!result) return null;
                return (
                  <ResultCard key={result.id} result={result} index={i}
                    onChange={(r) => updateResult(i, r)}
                    onDelete={results.length > 1 ? () => { deleteResult(i); setResultIndex((idx) => Math.max(0, Math.min(idx, results.length - 2))); } : undefined}
                    onTogglePin={() => togglePin(i)}
                    cardColor={resultColors[i % resultColors.length]}
                  />
                );
              })()}
            </>
          )}
        </section>

        {/* ── Step 3: Factors ── */}
        <section
          className="overflow-hidden rounded-[28px] p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: bgS3, color: textOn(bgS3) }}
        >
          <div className="flex items-center justify-between">
            <StepLabel num={3} label="影响因子" inverted={inv3} />
            <AIGenerateBtn loading={aiFactorsLoading} onClick={handleGenerateFactors} inverted={inv3} />
          </div>
          <StepDivider inverted={inv3} />
          <div className="flex flex-wrap items-center gap-2">
            <RangeSelector min={4} max={16} value={factorCount} onChange={setFactorCount} inverted={inv3} />
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
        </section>

        {/* ── Step 4: Result Vectors ── */}
        <section
          className="overflow-hidden rounded-[28px] p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: bgS4, color: textOn(bgS4) }}
        >
          <div className="flex items-center justify-between">
            <StepLabel num={4} label="结果向量" inverted={inv4} description="为每个结果在每个因子维度上设定 0-100 的位置，构成该结果的人格向量。" />
            <AIGenerateBtn loading={aiVectorsLoading} onClick={handleGenerateResultVectors} inverted={inv4} />
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
                    className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-all disabled:opacity-30 ${
                      inv4 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                    }`}
                  >
                    ← 上一个
                  </button>

                  <span className={`text-sm font-semibold ${inv4 ? "text-white/70" : "text-[var(--muted)]"}`}>
                    {result.name}
                  </span>

                  <button type="button"
                    onClick={() => setResultIndex((idx) => Math.min(aligned.length - 1, idx + 1))}
                    disabled={resultIndex >= aligned.length - 1}
                    className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-all disabled:opacity-30 ${
                      inv4 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                    }`}
                  >
                    下一个 →
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
                  accentColor={resultColors[colorIdx % resultColors.length]}
                />
              </>
            );
          })()}
        </section>

        {/* ── Step 5: Distance Validator ── */}
        <section
          className="overflow-hidden rounded-[28px] p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: bgS5, color: textOn(bgS5) }}
        >
          <StepLabel num={5} label="结果区分度检查" inverted={inv5} description="基于欧氏距离计算结果向量之间的相似程度。相似度 > 55% 表示两个人格位置较接近。" />
          <StepDivider inverted={inv5} />
          <DistanceValidator resultVectors={resultVectors} results={results} accentColors={accentColors} />
        </section>

        {/* ── Step 6: Questions ── */}
        <section
          className="overflow-hidden rounded-[28px] p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: bgS6, color: textOn(bgS6) }}
        >
          <div className="flex items-center justify-between">
            <StepLabel num={6} label="题目与选项影响" inverted={inv6} description="每道题的每个选项都会在特定因子上产生增量效果，用户的最终向量是所有选项效果的累加。" />
            <AIGenerateBtn loading={aiQuestionsLoading} onClick={handleGenerateQuestions} inverted={inv6} />
          </div>
          <StepDivider inverted={inv6} />
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <RangeSelector min={4} max={20} value={questionCount} onChange={setQuestionCount} inverted={inv6} />
              <span className={`text-[10px] ${inv6 ? "text-white/50" : "text-[var(--muted)]"}`}>题</span>
              <RangeSelector min={2} max={6} value={optionsPerQuestion} onChange={setOptionsPerQuestion} inverted={inv6} />
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
              <div className="flex items-center justify-between">
                <button type="button"
                  onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                  disabled={questionIndex === 0}
                  className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-all disabled:opacity-30 ${
                    inv6 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                  }`}
                >
                  ← 上一题
                </button>

                <div className="flex items-center gap-1.5">
                  {questions.map((_, i) => (
                    <button key={i} type="button" onClick={() => setQuestionIndex(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all"
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
                  className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-all disabled:opacity-30 ${
                    inv6 ? "bg-white/15 text-white hover:bg-white/25" : "bg-[var(--ink)]/6 text-[var(--ink)] hover:bg-[var(--ink)]/12"
                  }`}
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
                accentColors={accentColors}
                onDelete={
                  questions.length > 1
                    ? () => { deleteQuestion(questionIndex); setQuestionIndex((i) => Math.max(0, Math.min(i, questions.length - 2))); }
                    : undefined
                }
                onTogglePin={() => toggleQuestionPin(questionIndex)}
              />
            </>
          )}
        </section>

        {/* ── Step 7: Coverage Validator ── */}
        <section
          className="overflow-hidden rounded-[28px] p-5 sm:p-6 space-y-4"
          style={{ backgroundColor: bgS7, color: textOn(bgS7) }}
        >
          <CoverageValidator questions={questions} factors={factors} bgColor={bgS7} noCard accentColors={accentColors} />
        </section>

        {/* ── Save ── */}
        <section className="flex flex-col items-center gap-4 pb-16 pt-8">
          {isEditMode && (
            <button type="button" onClick={() => router.push("/create")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink)]/12 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--muted)] transition-all hover:text-[var(--ink)] hover:border-[var(--ink)]/25"
            >
              ← 返回创建模式
            </button>
          )}
          <SaveQuizButton
            quiz={{ meta, results, factors, resultVectors, questions, abstractness: quiz.abstractness, seriousness: quiz.seriousness, depth: quiz.depth, poeticness: quiz.poeticness }}
            editMode={isEditMode}
            editQuizId={editQuizId}
            accentColor={undefined}
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
