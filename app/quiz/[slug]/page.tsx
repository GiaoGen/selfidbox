import Link from "next/link";
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
    title: quiz.title,
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
      <div className="mx-auto w-full max-w-[640px] px-4 py-6 sm:px-6 sm:py-12">
        <QuizPlayer quiz={quiz} />

        <footer className="mt-6 border-t border-dashed border-[var(--ink)]/15 pt-5 text-center">
          <p className="text-xs text-[var(--muted)]">
            Powered by{" "}
            <Link href="/" className="font-medium text-[var(--ink)] hover:underline">
              SelfIDBox
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
