import { NextResponse } from "next/server";
import { getProfileSources } from "@/lib/user-profile-db";

const DEV_USER_ID = "b64cd3ef-2982-429e-b546-585d156774b6";

export async function GET() {
  try {
    const sources = await getProfileSources(DEV_USER_ID);
    return NextResponse.json({ ok: true, sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ProfileSources] error:", message);
    return NextResponse.json(
      { ok: false, error: message, sources: [] },
      { status: 500 },
    );
  }
}
