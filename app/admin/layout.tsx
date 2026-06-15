import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!adminIds.includes(user.id)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--ink)]">403</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">无权访问管理后台</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      {/* Mobile nav bar */}
      <div className="flex items-center gap-3 border-b border-[var(--hairline)] bg-[var(--surface-card)] px-4 py-3 lg:hidden">
        <span className="text-lg font-bold tracking-[-0.02em]">
          SelfID <span className="text-[var(--muted)]">Admin</span>
        </span>
        <span className="ml-auto text-xs text-[var(--muted)]">
          请在桌面端访问以获得完整体验
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] gap-6 px-4 py-6 sm:px-6">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
