import { notFound } from "next/navigation";
import { getQuizBySlug } from "@/lib/quizzes-db";
import { QuizPlayer } from "@/components/quiz-runtime/QuizPlayer";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);
  if (!quiz) return { title: "测试未找到" };
  return {
    title: `${quiz.title} — SelfIDBox`,
    description: quiz.hook || `来测测你是哪种${quiz.title}`,
  };
}

export default async function QuizPage({ params }: Props) {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);

  if (!quiz) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)]">
      <div className="mx-auto w-full max-w-[640px] px-5 py-10 sm:px-6 sm:py-16">
        <div className="mb-10">
          <p className="text-sm font-medium text-[var(--muted)]">{quiz.quiz_type === "personality" ? "人格测试" : quiz.quiz_type === "fun" ? "趣味测试" : "测试"}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
            {quiz.title}
          </h1>
          {quiz.hook && (
            <p className="mt-1 text-[15px] leading-relaxed text-[var(--body)]">
              {quiz.hook}
            </p>
          )}
        </div>

        <QuizPlayer quiz={quiz} />

        <footer className="mt-20 border-t border-[var(--ink)]/6 pt-6 text-center">
          <p className="text-xs text-[var(--muted)]">
            Powered by{" "}
            <a href="/" className="font-medium text-[var(--ink)] hover:underline">
              SelfIDBox
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
