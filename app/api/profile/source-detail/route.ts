import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSourceDetail } from "@/lib/source-detail-db";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  /* ---- 1. Auth check ---- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "NOT_AUTHENTICATED" },
      { status: 401 },
    );
  }

  /* ---- 2. Parse query params ---- */
  const sourceType = request.nextUrl.searchParams.get("source_type") as
    | "report"
    | "quiz"
    | null;
  const id = request.nextUrl.searchParams.get("id");

  if (!sourceType || !id) {
    return NextResponse.json(
      { ok: false, error: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  if (sourceType !== "report" && sourceType !== "quiz") {
    return NextResponse.json(
      { ok: false, error: "INVALID_SOURCE_TYPE" },
      { status: 400 },
    );
  }

  /* ---- 3. Fetch ---- */
  const detail = await getSourceDetail(user.id, sourceType, id);

  if (!detail) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, detail });
}
