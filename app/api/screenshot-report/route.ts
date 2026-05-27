import { NextResponse } from "next/server";
import { rebuildUserProfile } from "@/lib/rebuild-user-profile";

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
    const formData = await request.formData();
    const userId = formData.get("user_id");
    const file = formData.get("file");

    if (!userId || !file) {
      return NextResponse.json(
        { ok: false, error: "缺少 user_id 或 file" },
        { status: 400 },
      );
    }

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
      return NextResponse.json(
        { ok: false, error: "OCR API 请求失败", upstream: data },
        { status: 502 },
      );
    }

    console.log("[OCR Proxy] OCR result ok");
    console.log(`[OCR Proxy] userId: ${userId}`);
    console.log(`[OCR Proxy] parse_status: ${data.parse_status}`);

    // If OCR succeeded with a normalized report, rebuild user_profile
    let profileRebuildResult: { ok: boolean; report_count?: number; error?: string } | null = null;

    if (data.ok && !data.duplicate && data.parse_status === "normalized") {
      console.log("[OCR Proxy] calling rebuildUserProfile");
      try {
        const result = await rebuildUserProfile(String(userId));
        profileRebuildResult = result;
        console.log(`[OCR Proxy] profile_rebuild_result: ${JSON.stringify(result)}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[OCR Proxy] rebuild result: failed —", msg);
        profileRebuildResult = { ok: false, error: msg };
      }
    }

    return NextResponse.json({
      ...data,
      profile_rebuild_result: profileRebuildResult,
    });
  } catch (err) {
    console.error("screenshot-report proxy error:", err);
    return NextResponse.json(
      { ok: false, error: "代理请求异常" },
      { status: 500 },
    );
  }
}
