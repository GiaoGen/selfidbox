import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { DEV_USER_ID } from "@/lib/dev-user";
import { rebuildUserProfileFromAllSources } from "@/lib/rebuild-user-profile";

/* ================================================================== */
/*  POST /api/profile/sources/delete                                    */
/*                                                                      */
/*  Body: { source_type: "report" | "quiz", id: string }                */
/*                                                                      */
/*  Deletes the record from the matching table (scoped to DEV_USER_ID)  */
/*  then does a FULL rebuild of user_profile from all remaining data.   */
/* ================================================================== */

export async function POST(req: NextRequest) {
  try {
    /* ---- 1. Parse & validate body ---- */

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "请求体格式无效" }, { status: 400 });
    }

    const sourceType = body.source_type as string | undefined;
    const id = body.id as string | number | undefined;

    console.log("[ProfileSourcesDelete] request", { source_type: sourceType, id });

    if (!sourceType) {
      return NextResponse.json(
        { ok: false, error: "MISSING_SOURCE_TYPE", received: body },
        { status: 400 },
      );
    }

    if (id === undefined || id === null || id === "") {
      return NextResponse.json(
        { ok: false, error: "MISSING_SOURCE_ID", received: body },
        { status: 400 },
      );
    }

    if (sourceType !== "report" && sourceType !== "quiz") {
      return NextResponse.json(
        { ok: false, error: "source_type 必须是 report 或 quiz", received: body },
        { status: 400 },
      );
    }

    const userId = DEV_USER_ID; // TODO: replace with Supabase Auth user id

    /* ---- 2. Delete from the correct table ---- */

    const table = sourceType === "report" ? "reports" : "quiz_attempts";

    console.log(`[ProfileSourcesDelete] deleting ${sourceType} id=${id}`);

    const { data: deletedRows, error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");

    if (deleteError) {
      console.error(`[ProfileSourcesDelete] delete from ${table} failed: ${deleteError.message}`);
      return NextResponse.json(
        { ok: false, error: `删除失败：${deleteError.message}` },
        { status: 500 },
      );
    }

    if (!deletedRows || deletedRows.length === 0) {
      console.warn(`[ProfileSourcesDelete] no row found — table=${table} id=${id} userId=${userId}`);
      return NextResponse.json(
        { ok: false, error: "未找到该数据来源，或无权删除" },
        { status: 404 },
      );
    }

    console.log(`[ProfileSourcesDelete] deleted 1 row from ${table}`);

    /* ---- 3. Full rebuild user_profile from remaining sources ---- */

    let profile_rebuild_result: unknown;
    try {
      profile_rebuild_result = await rebuildUserProfileFromAllSources(userId);
    } catch (rebuildErr) {
      console.error("[ProfileSourcesDelete] profile rebuild failed:", rebuildErr);
      return NextResponse.json(
        {
          ok: false,
          error: `数据来源已删除，但用户档案重建失败：${rebuildErr instanceof Error ? rebuildErr.message : "未知错误"}`,
        },
        { status: 500 },
      );
    }

    /* ---- 4. Return success ---- */

    return NextResponse.json({
      ok: true,
      deleted: true,
      profile_rebuild_result,
    });
  } catch (err) {
    console.error("[ProfileSourcesDelete] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "服务器内部错误" },
      { status: 500 },
    );
  }
}
