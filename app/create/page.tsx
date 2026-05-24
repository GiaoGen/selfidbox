import { TopNavbar } from "@/components/layout/TopNavbar";
import { QuizMetaCard } from "@/components/quiz-engine/QuizMetaCard";
import { ResultCard } from "@/components/quiz-engine/ResultCard";
import { FactorList } from "@/components/quiz-engine/FactorList";
import { ResultVectorCard } from "@/components/quiz-engine/ResultVectorCard";
import { DistanceValidator } from "@/components/quiz-engine/DistanceValidator";
import { QuestionEffectsCard } from "@/components/quiz-engine/QuestionEffectsCard";
import { CoverageValidator } from "@/components/quiz-engine/CoverageValidator";
import { SimilarityRanking } from "@/components/quiz-engine/SimilarityRanking";
import { FinalResultPreview } from "@/components/quiz-engine/FinalResultPreview";
import {
  quizMeta,
  results,
  factors,
  resultVectors,
  questions,
  mockUserVector,
  finalResultInterpretation,
  finalResultSubtitle,
} from "@/lib/mock-quiz-engine";

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

export default function CreatePage() {
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
          <QuizMetaCard meta={quizMeta} />
        </section>

        {/* Step 2: Results */}
        <section className="space-y-4">
          <StepLabel num={2} label="Results" />
          <p className="text-base leading-7 text-[var(--body)]">
            定义测试可能产生的结果人格，每个结果有独立的名称、描述和特质标签。
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((result, i) => (
              <ResultCard key={result.id} result={result} index={i} />
            ))}
          </div>
        </section>

        {/* Step 3: Factors */}
        <section className="space-y-4">
          <StepLabel num={3} label="Factors" />
          <FactorList factors={factors} />
        </section>

        {/* Step 4: Result Vectors */}
        <section className="space-y-4">
          <StepLabel num={4} label="Result Vectors" />
          <p className="text-base leading-7 text-[var(--body)]">
            为每个结果在每个因子维度上设定 0-100 的位置，构成该结果的人格向量。
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {resultVectors.map((rv, i) => (
              <ResultVectorCard
                key={rv.resultId}
                result={results.find((r) => r.id === rv.resultId)!}
                vector={rv}
                factors={factors}
                index={i}
              />
            ))}
          </div>
        </section>

        {/* Step 5: Distance Validator */}
        <DistanceValidator
          resultVectors={resultVectors}
          results={results}
        />

        {/* Step 6: Questions + Option Effects */}
        <section className="space-y-4">
          <StepLabel num={6} label="Questions + Option Effects" />
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
              />
            ))}
          </div>
        </section>

        {/* Step 7: Coverage Validator */}
        <CoverageValidator questions={questions} factors={factors} />

        {/* Step 8: Mock User Result */}
        <SimilarityRanking
          userVector={mockUserVector}
          resultVectors={resultVectors}
          results={results}
          factors={factors}
        />

        {/* Step 9: Final Result Preview */}
        <FinalResultPreview
          result={results[0]}
          similarity={86}
          subtitle={finalResultSubtitle}
          interpretation={finalResultInterpretation.main}
          secondaryNote={finalResultInterpretation.secondary}
          secondaryResult={results[2]}
        />
      </div>
    </main>
  );
}
