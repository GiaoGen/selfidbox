import { NextResponse } from "next/server";
import { getProfileSources } from "@/lib/user-profile-db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "未登录", sources: [] },
        { status: 401 },
      );
    }

    const sources = await getProfileSources(user.id, supabase);
    return NextResponse.json({ ok: true, sources });
  } catch (err) {
    console.error("[ProfileSources] error:", err);
    return NextResponse.json(
      { ok: false, error: "获取数据来源失败", sources: [] },
      { status: 500 },
    );
  }
}
