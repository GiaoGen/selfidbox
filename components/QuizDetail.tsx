import Link from "next/link";
import { ExploreTopNavbar } from "@/components/layout/ExploreTopNavbar";
import type { QuizDetailRow, QuizDetailRelatedRow } from "@/lib/quizzes-db";
import { accentFromId } from "@/lib/explore/types";
import type { AccentKey } from "@/lib/explore/types";

const accentClasses: Record<AccentKey, string> = {
  pink: "bg-[#ff4d8b] text-white",
  teal: "bg-[#1a3a3a] text-white",
  lavender: "bg-[#b8a4ed] text-[#0a0a0a]",
  peach: "bg-[#ffb084] text-[#0a0a0a]",
  ochre: "bg-[#e8b94a] text-[#0a0a0a]",
  mint: "bg-[#a4d4c5] text-[#0a0a0a]",
};

const quizTypeLabels: Record<string, string> = {
  personality: "人格测试",
  career: "职业测评",
  fun: "娱乐测试",
};

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

export function QuizDetail({
  quiz,
  relatedQuizzes,
}: {
  quiz: QuizDetailRow;
  relatedQuizzes: QuizDetailRelatedRow[];
}) {
  const accent: AccentKey = accentFromId(quiz.id);
  const categorySlug = quiz.category?.slug ?? "";
  const categoryLabel = quiz.category?.name ?? "";
  const quizTypeLabel = quizTypeLabels[quiz.quiz_type] ?? quiz.quiz_type;

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <ExploreTopNavbar />

        {/* Hero */}
        <section
          className={`overflow-hidden rounded-[36px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.08)] sm:p-8 ${accentClasses[accent]}`}
        >
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/28 px-3 py-1 text-sm font-semibold">
              社区 Quiz
            </span>
            {categoryLabel && (
              <span className="rounded-full bg-white/28 px-3 py-1 text-sm font-semibold">
                {categoryLabel}
              </span>
            )}
            {quizTypeLabel && (
              <span className="rounded-full bg-white/28 px-3 py-1 text-sm font-semibold">
                {quizTypeLabel}
              </span>
            )}
          </div>

          <div className="mt-8 space-y-5">
            <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-7xl">
              {quiz.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 opacity-85 sm:text-lg">
              {quiz.description ?? quiz.hook ?? ""}
            </p>
          </div>

          <div className="mt-8">
            <Link
              href={`/quiz/${quiz.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-[#0a0a0a] shadow-[0_8px_24px_rgba(10,10,10,0.12)] transition-transform hover:scale-[1.03] active:scale-95"
            >
              去做这个测试
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="opacity-60"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </section>

        {/* Description */}
        {(quiz.description || quiz.hook) && (
          <section className="rounded-[32px] bg-[var(--surface-card)] p-5 sm:p-6">
            <p className="text-sm font-semibold text-[var(--muted)]">简介</p>
            <p className="mt-3 text-base leading-7 text-[var(--body)]">
              {quiz.description ?? quiz.hook ?? ""}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {quiz.featured && (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold">
                  精选
                </span>
              )}
              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold">
                {quizTypeLabel}
              </span>
              {categoryLabel && (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold">
                  {categoryLabel}
                </span>
              )}
            </div>
          </section>
        )}

        {/* Detail pills */}
        <section className="grid gap-3 sm:grid-cols-2">
          <DetailPill
            label="已完成次数"
            value={`${quiz.attempt_count} 次`}
          />
          <DetailPill label="发布时间" value={formatDate(quiz.created_at)} />
        </section>

        {/* Related quizzes */}
        {relatedQuizzes.length > 0 && (
          <section className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                Related quizzes
              </p>
              <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
                相关社区测试
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {relatedQuizzes.map((rq) => {
                const rqAccent = accentFromId(rq.id);
                return (
                  <Link
                    key={rq.id}
                    href={`/quizzes/${rq.slug}`}
                    className={`flex min-h-44 flex-col justify-between rounded-[28px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.08)] ${accentClasses[rqAccent]}`}
                  >
                    <div>
                      <span className="rounded-full bg-white/28 px-3 py-1 text-xs font-semibold">
                        {rq.attempt_count} 次完成
                      </span>
                      <h3 className="mt-4 text-xl font-semibold leading-tight tracking-[-0.02em]">
                        {rq.title}
                      </h3>
                    </div>
                    <p className="mt-5 line-clamp-2 text-sm leading-6 opacity-85">
                      {rq.description ?? rq.hook ?? ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
