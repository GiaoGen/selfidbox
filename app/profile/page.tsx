import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getProfileSources, getUserProfile } from "@/lib/user-profile-db";
import { ProfileInteractions } from "@/components/profile/ProfileInteractions";
import { Greeting } from "@/components/Greeting";
import { PendingSaveHandler } from "@/components/profile/PendingSaveHandler";
import { SlideOutTray } from "@/components/navigation/SlideOutTray";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "画像 — 你的人格肖像",
  description: "View your AI-generated personality profile and quiz result collection.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [sources, profileResult] = await Promise.all([
    getProfileSources(user.id, supabase),
    getUserProfile(user.id, supabase)
      .then((profile) => ({ profile, error: false }))
      .catch((error) => {
        console.error("[profile] radar data load failed", error);
        return { profile: null, error: true };
      }),
  ]);

  return (
    <>
      <PendingSaveHandler />
      <div className="fixed inset-0" style={{ backgroundColor: "#fffaf0" }} aria-hidden />
      <main className="relative min-h-screen text-[#1c1c1c]">
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between -mb-2">
            <Greeting />
            <SlideOutTray />
          </div>

          <hr className="border-0 border-t-2 border-dashed border-[var(--ink)]/10" />

          <ProfileInteractions initialSources={sources} profile={profileResult.profile} profileError={profileResult.error} />
        </div>
      </main>
    </>
  );
}
