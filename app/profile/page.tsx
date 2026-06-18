import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUserProfile, getProfileSources, type ProfileSourceEntry } from "@/lib/user-profile-db";
import { ProfileRadar, type RadarPoint } from "@/components/ProfileRadar";
import { ProfileInteractions } from "@/components/profile/ProfileInteractions";
import { ScreenshotReportUploader } from "@/components/profile/ScreenshotReportUploader";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile — Your Personality Portrait",
  description: "View your AI-generated personality profile, radar charts, and quiz result collection.",
};

/* ------------------------------------------------------------------ */
/*  Dimension name mapping (EN key → CN label)                          */
/* ------------------------------------------------------------------ */

const DIM_LABELS: Record<string, string> = {
  // core_vector
  social: "社交性",
  sensitivity: "敏感度",
  rationality: "理性度",
  curiosity: "探索欲",
  independence: "独立性",
  expressiveness: "表达欲",
  drive: "行动力",
  imagination: "幻想度",
  // social_vector
  assertiveness: "主张性",
  security_need: "安全感需求",
  empathy: "共情力",
  dramaticness: "戏剧性",
  orderliness: "秩序感",
  contradiction: "反差感",
  attachment: "亲密倾向",
  presence: "存在感",
};

function cnLabel(key: string): string {
  return DIM_LABELS[key] ?? key;
}

/* ------------------------------------------------------------------ */
/*  JSONB vector → RadarPoint[]                                        */
/* ------------------------------------------------------------------ */

function toRadarPoints(vector: Record<string, unknown>): RadarPoint[] {
  return Object.entries(vector).map(([name, value]) => {
    let num = Number(value);

    if (!Number.isFinite(num) && typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      for (const key of ["value", "score", "percent", "percentage", "level"]) {
        const v = obj[key];
        if (typeof v === "number" && Number.isFinite(v)) {
          num = v;
          break;
        }
      }
    }

    const safe = Number.isFinite(num) ? Math.round(num) : 0;
    return {
      name: cnLabel(name),
      english: name,
      value: Math.min(100, Math.max(0, safe)),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, sources] = await Promise.all([
    getUserProfile(user.id, supabase),
    getProfileSources(user.id, supabase),
  ]);
  const hasProfile =
    profile != null &&
    (profile.selfid_profile != null || profile.summary != null);

  const coreVector = profile?.core_vector ?? {};
  const socialVector = profile?.social_vector ?? {};
  const hasCore = Object.keys(coreVector).length > 0;
  const hasSocial = Object.keys(socialVector).length > 0;

  return (
    <>
      <div className="fixed inset-0" style={{ backgroundColor: "#fffaf0" }} aria-hidden />
      <main className="relative min-h-screen text-[#1c1c1c]">
        <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Radar charts — top, horizontal scroll ── */}
        {hasCore && (
          <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory -mx-4 px-4">
            <div className="snap-center shrink-0 w-[72vw] max-w-[360px]">
              <ProfileRadar
                title="核心人格"
                subtitle=""
                data={toRadarPoints(coreVector)}
                color="#ff4d8b"
              />
            </div>
            {hasSocial && (
              <div className="snap-center shrink-0 w-[72vw] max-w-[360px]">
                <ProfileRadar
                  title="社会表达"
                  subtitle=""
                  data={toRadarPoints(socialVector)}
                  color="#1a3a3a"
                />
              </div>
            )}
          </div>
        )}

        {hasProfile ? (
          <ProfileInteractions
            initialSources={sources}
          />
        ) : (
          <>
            <section className="rounded-[36px] bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_62%,#fffaf0_100%)] p-8 text-center text-[#0a0a0a] shadow-[0_18px_50px_rgba(10,10,10,0.08)] sm:p-10">
              <p className="text-lg font-semibold">还没有人格图谱</p>
              <p className="mt-2 text-sm opacity-70">
                上传一张测评截图开始生成。
              </p>
            </section>
            <ScreenshotReportUploader />
          </>
        )}
        </div>
      </main>
    </>
  );
}
