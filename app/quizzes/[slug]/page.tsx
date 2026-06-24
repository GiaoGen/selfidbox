import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { QuizDetail } from "@/components/QuizDetail";
import { getQuizDetail, getRelatedQuizzes } from "@/lib/quizzes-db";
import { createServiceClient } from "@/lib/supabase/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuizDetail(slug);
  if (!quiz) return { title: "Not Found" };
  return {
    title: `${quiz.title} — Quiz Detail`,
    description: quiz.description || quiz.hook || `查看 ${quiz.title} 的详细信息`,
  };
}

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

  // Look up creator username via service role (bypasses RLS, server-only)
  let creatorUsername: string | undefined;
  if (quiz.creator_user_id) {
    const serviceDb = createServiceClient();
    const { data: userRow } = await serviceDb
      .from("users")
      .select("username")
      .eq("id", quiz.creator_user_id)
      .single();
    creatorUsername = userRow?.username ?? undefined;
  }

  return (
    <QuizDetail
      quiz={quiz}
      relatedQuizzes={relatedQuizzes}
      creatorUsername={creatorUsername}
    />
  );
}
