import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "未登录", words: [] },
        { status: 401 },
      );
    }

    const { data: attempts, error } = await supabase
      .from("quiz_attempts")
      .select("final_result_name")
      .eq("user_id", user.id)
      .not("final_result_name", "is", null);

    if (error) {
      console.error("[WordCloud] query error:", error.message);
      return NextResponse.json(
        { ok: false, error: "获取词云数据失败", words: [] },
        { status: 500 },
      );
    }

    // Aggregate counts
    const countMap = new Map<string, number>();
    for (const a of attempts ?? []) {
      const name = a.final_result_name?.trim();
      if (name) {
        countMap.set(name, (countMap.get(name) ?? 0) + 1);
      }
    }

    const words = Array.from(countMap.entries()).map(([label, count]) => ({
      label,
      count,
    }));

    // Sort by count desc
    words.sort((a, b) => b.count - a.count);

    return NextResponse.json({ ok: true, words });
  } catch (err) {
    console.error("[WordCloud] error:", err);
    return NextResponse.json(
      { ok: false, error: "获取词云数据失败", words: [] },
      { status: 500 },
    );
  }
}
