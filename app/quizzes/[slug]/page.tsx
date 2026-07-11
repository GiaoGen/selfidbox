import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { QuizDetail } from "@/components/QuizDetail";
import { getQuizDetail, getRelatedQuizzes } from "@/lib/quizzes-db";
import { createServiceClient } from "@/lib/supabase/service";
import { quizToExploreCard } from "@/lib/explore/mapper";
import type { ExploreCard } from "@/lib/explore/types";
import type { AdminQuizRow } from "@/lib/admin-db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuizDetail(slug);
  if (!quiz) return { title: "未找到" };
  return {
    title: `${quiz.title} — 测验详情`,
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

  // 👇 顶部卡片 + 相似测试都走 /explore 的 quizToExploreCard mapper
  const categoryLabel = quiz.category?.name;
  const categorySlug = quiz.category?.slug;

  const mainCard = quizToExploreCard(
    quiz as unknown as AdminQuizRow,
    categoryLabel,
    categorySlug,
    quiz.image_url ?? undefined,
    quiz.result_color,
  );
  const bgColor = mainCard.bg_color;
  const textColor = mainCard.text_color;

  const relatedCards: ExploreCard[] = relatedQuizzes.map((rq) =>
    quizToExploreCard(
      rq as unknown as AdminQuizRow,
      categoryLabel,
      categorySlug,
      rq.image_url ?? undefined,
      rq.result_color,
    ),
  );

  return (
    <QuizDetail
      quiz={quiz}
      relatedCards={relatedCards}
      creatorUsername={creatorUsername}
      bgColor={bgColor}
      textColor={textColor}
    />
  );
}
