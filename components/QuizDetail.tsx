import { StampCard } from "@/components/StampCard";
import { TestCard } from "@/app/explore/_components/test-card";
import type { QuizDetailRow, QuizDetailRelatedRow } from "@/lib/quizzes-db";
import { accentFromId } from "@/lib/explore/types";
import type { ExploreCard } from "@/lib/explore/types";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";

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
  const bgColor = nipponColorForSlug(quiz.slug);
  const textColor = textColorForNipponBg(bgColor);
  const isDark = textColor === "#FCFAF2";
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
          style={{ backgroundColor: bgColor, color: textColor }}
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
        <section className={`grid grid-cols-2 gap-3 ${quiz.image_url ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
          {quiz.image_url && (
            <div className="aspect-square w-full overflow-hidden">
              <img
                src={quiz.image_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}
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
              <h2 className="text-3xl font-semibold tracking-[-0.03em]">
                相似测试
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {relatedQuizzes.map((rq) => {
                const bg = nipponColorForSlug(rq.slug);
                const card: ExploreCard = {
                  id: rq.id,
                  source_type: "community",
                  href: `/quizzes/${rq.slug}`,
                  title: rq.title,
                  description: rq.description ?? rq.hook ?? "",
                  image: rq.image_url ?? "",
                  category_id: null,
                  categoryLabel: "",
                  featured: false,
                  popularity_score: 0,
                  created_at: rq.created_at ?? "",
                  tags: [],
                  estimatedMinutes: null,
                  accent: accentFromId(rq.id),
                  bg_color: bg,
                  text_color: textColorForNipponBg(bg),
                };
                return <TestCard key={rq.id} site={card} />;
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
