import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCredits } from "@/lib/credits/service";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "NOT_AUTHENTICATED" },
      { status: 401 },
    );
  }

  try {
    const snapshot = await getCredits(user.id);
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (err) {
    console.error("[Credits] Error fetching credits:", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL" },
      { status: 500 },
    );
  }
}
