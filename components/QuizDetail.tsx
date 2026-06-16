import Link from "next/link";
import { StampCard } from "@/components/StampCard";
import type { QuizDetailRow, QuizDetailRelatedRow } from "@/lib/quizzes-db";
import { accentFromId } from "@/lib/explore/types";
import type { AccentKey } from "@/lib/explore/types";

const accentClasses: Record<AccentKey, { bg: string; text: string }> = {
  pink: { bg: "#ff4d8b", text: "#ffffff" },
  teal: { bg: "#1a3a3a", text: "#ffffff" },
  lavender: { bg: "#b8a4ed", text: "#0a0a0a" },
  peach: { bg: "#ffb084", text: "#0a0a0a" },
  ochre: { bg: "#e8b94a", text: "#0a0a0a" },
  mint: { bg: "#a4d4c5", text: "#0a0a0a" },
};

const quizTypeLabels: Record<string, string> = {
  personality: "人格测试",
  career: "职业测评",
  fun: "娱乐测试",
};

export function QuizDetail({
  quiz,
  relatedQuizzes,
}: {
  quiz: QuizDetailRow;
  relatedQuizzes: QuizDetailRelatedRow[];
}) {
  const accent: AccentKey = accentFromId(quiz.id);
  const ac = accentClasses[accent];
  const isDark = ac.text === "#ffffff";
  const tintColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(10,10,10,0.45)";
  const borderColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.15)";

  const categoryLabel = quiz.category?.name ?? "";
  const quizTypeLabel = quizTypeLabels[quiz.quiz_type] ?? quiz.quiz_type;
  const description = quiz.description ?? quiz.hook ?? "";

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* ---- 小票卡片：标题 + 描述 ---- */}
        <section
          className="p-5 shadow-[0_4px_20px_rgba(0,0,0,0.10)] sm:p-6"
          style={{ backgroundColor: ac.bg, color: ac.text }}
        >
          {/* 上部：标题 + 种类 */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {quiz.title}
            </h1>
            <span className="shrink-0 pt-0.5 text-xs font-light" style={{ color: tintColor }}>
              {quizTypeLabel}
            </span>
          </div>

          <hr className="my-3 border-t-2 border-dashed" style={{ borderColor }} />

          {/* 中部：描述 */}
          <p className="text-sm font-normal leading-6" style={{ color: tintColor }}>
            {description}
          </p>

          <hr className="my-3 border-t-2 border-dashed" style={{ borderColor }} />

          {/* 下部：种类 + 来源 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-light" style={{ color: tintColor }}>
              {categoryLabel && <span>{categoryLabel}</span>}
              {quiz.featured && <span>· 精选</span>}
            </div>
            <span className="text-xs font-light" style={{ color: tintColor }}>SelfIDBox</span>
          </div>
        </section>

        {/* ---- 邮票：次数 + 日期 + CTA ---- */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StampCard colorKey={`attempts-${quiz.id}`}>
            <div className="text-center">
              <p className="text-[10px] font-light uppercase tracking-[0.15em] opacity-50">已完成</p>
              <p className="mt-1 text-xl font-semibold">{quiz.attempt_count} 次</p>
            </div>
          </StampCard>

          <StampCard colorKey={`date-${quiz.id}`}>
            <div className="text-center">
              <p className="text-[10px] font-light uppercase tracking-[0.15em] opacity-50">发布于</p>
              <p className="mt-1 text-xl font-semibold">{formatDate(quiz.created_at)}</p>
            </div>
          </StampCard>

          <StampCard colorKey={`cta-${quiz.id}`} href={`/quiz/${quiz.slug}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </StampCard>
        </section>

        {/* ---- 相关社区测试 ---- */}
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
                const ra = accentClasses[rqAccent];
                const rqDark = ra.text === "#ffffff";
                const rqTint = rqDark ? "rgba(255,255,255,0.55)" : "rgba(10,10,10,0.45)";
                const rqBorder = rqDark ? "rgba(255,255,255,0.25)" : "rgba(10,10,10,0.15)";
                return (
                  <Link
                    key={rq.id}
                    href={`/quizzes/${rq.slug}`}
                    className="block p-4 shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
                    style={{ backgroundColor: ra.bg, color: ra.text }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold leading-snug">
                        {rq.title}
                      </h3>
                      <span className="shrink-0 pt-0.5 text-[10px] font-light" style={{ color: rqTint }}>
                        {rq.attempt_count} 次
                      </span>
                    </div>
                    <hr className="my-2 border-t-2 border-dashed" style={{ borderColor: rqBorder }} />
                    <p className="line-clamp-2 text-xs font-normal leading-5" style={{ color: rqTint }}>
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
