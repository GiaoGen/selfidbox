import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ================================================================== */
/*  PATCH /api/user — update username (write path only)                */
/*                                                                      */
/*  Reads happen client-side via supabase.from("users") directly       */
/*  because public.users has no RLS and doesn't need an API hop.       */
/* ================================================================== */

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = body.username?.trim();
  if (!raw || raw.length < 2 || raw.length > 30) {
    return NextResponse.json(
      { error: "用户名需要 2–30 个字符" },
      { status: 400 },
    );
  }

  // Check uniqueness (exclude current user)
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", raw)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "用户名已被占用" },
      { status: 409 },
    );
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ username: raw })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "更新用户名失败" },
      { status: 500 },
    );
  }

  return NextResponse.json({ username: raw });
}
