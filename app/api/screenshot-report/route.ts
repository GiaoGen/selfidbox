import { NextResponse } from "next/server";
import { rebuildUserProfile } from "@/lib/rebuild-user-profile";
import { createClient } from "@/lib/supabase/server";

const OCR_API_BASE_URL = process.env.OCR_API_BASE_URL;
const OCR_API_KEY = process.env.OCR_API_KEY;

export async function POST(request: Request) {
  if (!OCR_API_BASE_URL || !OCR_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "OCR API 未配置" },
      { status: 500 },
    );
  }

  try {
    /* ---- auth ---- */
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "未登录" },
        { status: 401 },
      );
    }

    const userId = user.id;

    /* ---- parse form ---- */
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "缺少 file" },
        { status: 400 },
      );
    }

    console.log("[OCR Proxy] received upload");
    console.log(`[OCR Proxy] userId: ${userId}`);

    /* ---- forward to OCR API ---- */

    const upstream = new FormData();
    upstream.append("user_id", userId);
    upstream.append("file", file);

    const res = await fetch(`${OCR_API_BASE_URL}/screenshot-report`, {
      method: "POST",
      headers: { "x-api-key": OCR_API_KEY },
      body: upstream,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`[OCR Proxy] OCR API returned ${res.status}`);
      return NextResponse.json(
        { ok: false, error: "OCR API 请求失败", upstream: data },
        { status: 502 },
      );
    }

    console.log("[OCR Proxy] OCR response ok");
    console.log(`[OCR Proxy] duplicate: ${data.duplicate}`);
    console.log(`[OCR Proxy] parse_status: ${data.parse_status}`);
    console.log(`[OCR Proxy] saved_report parse_status: ${data.saved_report?.parse_status}`);

    /* ---- decide whether to rebuild profile ---- */

    const ocrOk = data.ok === true;
    const notDuplicate = data.duplicate !== true;

    const isNormalized =
      data.parse_status === "normalized" ||
      data.saved_report?.parse_status === "normalized";

    const isAssessmentReport = data.report?.is_assessment_report === true;

    const shouldRebuild = ocrOk && notDuplicate && (isNormalized || isAssessmentReport);

    console.log(`[OCR Proxy] shouldRebuildProfile: ${shouldRebuild} (ok=${ocrOk} notDup=${notDuplicate} norm=${isNormalized} assess=${isAssessmentReport})`);

    /* ---- rebuild ---- */

    let profileRebuildResult: { ok: boolean; report_count?: number; error?: string } | null = null;

    if (shouldRebuild) {
      console.log("[OCR Proxy] calling rebuildUserProfile");
      try {
        const result = await rebuildUserProfile(userId);
        profileRebuildResult = result;
        console.log(`[OCR Proxy] profile_rebuild_result: ${JSON.stringify(result)}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[OCR Proxy] rebuildUserProfile threw:", err);
        profileRebuildResult = { ok: false, error: msg };
      }
    } else {
      console.log("[OCR Proxy] skipping rebuild — conditions not met");
    }

    /* ---- respond ---- */

    return NextResponse.json({
      ...data,
      profile_rebuild_result: profileRebuildResult,
    });
  } catch (err) {
    console.error("[OCR Proxy] unhandled error:", err);
    return NextResponse.json(
      { ok: false, error: "代理请求异常" },
      { status: 500 },
    );
  }
}
