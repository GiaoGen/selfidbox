import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getAdminQuizById,
  getAdminCategories,
  updateQuizMetadata,
} from "@/lib/admin-db";
import { grantCredit } from "@/lib/credits/service";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { QuizEditForm } from "./form";

export default async function EditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quiz, categories] = await Promise.all([
    getAdminQuizById(id),
    getAdminCategories(),
  ]);

  if (!quiz) notFound();

  async function handleUpdate(data: {
    title: string;
    description: string;
    cover_image_url: string;
    category_id: string;
    featured: boolean;
    status: string;
    color: string;
  }) {
    "use server";
    const adminId = await requireAdmin();
    if (!adminId) return { success: false as const, error: "未授权" };
    try {
      // Grant +5 credits when quiz is first approved (status → published)
      const oldStatus = quiz?.status;
      const creatorId = quiz?.creator_user_id;
      if (oldStatus !== "published" && data.status === "published" && creatorId) {
        await grantCredit(creatorId, "quiz_approved", 5, id).catch((err) => {
          console.warn("[AdminEdit] grantCredit failed:", err);
        });
      }

      await updateQuizMetadata(id, {
        title: data.title,
        description: data.description || null,
        cover_image_url: data.cover_image_url || null,
        category_id: data.category_id || null,
        featured: data.featured,
        status: data.status,
        color: data.color || null,
      });
      revalidatePath("/admin/quizzes");
      redirect("/admin/quizzes");
    } catch (error) {
      console.error("UPDATE QUIZ METADATA ERROR", error);
      return { success: false as const, error };
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="编辑 Quiz"
        subtitle={quiz.title}
      />

      {/* Quick info */}
      <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-[var(--surface-card)] px-5 py-3 text-sm">
        <StatusBadge status={quiz.status} />
        <span className="text-[var(--muted)]">
          {quiz.attempt_count} 次答题
        </span>
        <span className="text-[var(--muted)]">
          Slug: {quiz.slug}
        </span>
      </div>

      <QuizEditForm
        initial={{
          title: quiz.title,
          description: quiz.description ?? "",
          cover_image_url: quiz.cover_image_url ?? "",
          category_id: quiz.category_id ?? "",
          featured: quiz.featured,
          status: quiz.status,
          color: quiz.color ?? "",
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
