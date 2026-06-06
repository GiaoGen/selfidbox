import { notFound } from "next/navigation";
import { QuizDetail } from "@/components/QuizDetail";
import { getQuizDetail, getRelatedQuizzes } from "@/lib/quizzes-db";

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = await getQuizDetail(slug);

  if (!quiz) {
    notFound();
  }

  const relatedQuizzes = quiz.category_id
    ? await getRelatedQuizzes(quiz.category_id, slug)
    : [];

  return (
    <QuizDetail
      quiz={quiz}
      relatedQuizzes={relatedQuizzes}
    />
  );
}
