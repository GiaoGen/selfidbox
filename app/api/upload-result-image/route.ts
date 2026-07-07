import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import sharp from "sharp";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_DIMENSION = 1200;
const TARGET_BYTES = 200 * 1024; // 200 KB
const INITIAL_QUALITY = 80;
const MIN_QUALITY = 50;
const ALPHA_QUALITY = 100;
const BUCKET = "quiz-result-images";

export async function POST(request: Request) {
  try {
    /* ---- auth ---- */
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    /* ---- parse form ---- */
    const formData = await request.formData();
    const file = formData.get("file");
    const resultId = formData.get("resultId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "缺少图片文件" }, { status: 400 });
    }

    if (!resultId || typeof resultId !== "string") {
      return NextResponse.json({ error: "缺少 resultId" }, { status: 400 });
    }

    // Validate resultId contains only safe characters for file paths
    if (!/^[a-zA-Z0-9_-]+$/.test(resultId)) {
      return NextResponse.json(
        { error: "resultId 格式不正确" },
        { status: 400 },
      );
    }

    /* ---- validate ---- */
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "仅支持 PNG、JPEG、WebP 格式" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "图片不能超过 10 MB" },
        { status: 400 },
      );
    }

    /* ---- process with sharp ---- */
    const buffer = Buffer.from(await file.arrayBuffer());

    // Adaptive quality: try initial quality, downgrade if output exceeds target
    let quality = INITIAL_QUALITY;
    let webpBuffer: Buffer;

    do {
      webpBuffer = await sharp(buffer)
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality, alphaQuality: ALPHA_QUALITY })
        .toBuffer();

      quality -= 10;
    } while (webpBuffer.length > TARGET_BYTES && quality >= MIN_QUALITY);

    // Validate WebP header (sharp might produce corrupted output on some platforms)
    const isValidWebP =
      webpBuffer.length >= 12 &&
      webpBuffer.slice(0, 4).toString("ascii") === "RIFF" &&
      webpBuffer.slice(8, 12).toString("ascii") === "WEBP";

    if (!isValidWebP) {
      console.error("[upload-result-image] Invalid WebP output, size:", webpBuffer.length);
      return NextResponse.json(
        { error: "图片处理失败" },
        { status: 500 },
      );
    }

    /* ---- upload to Supabase Storage ---- */
    const storage = createServiceClient();
    const path = `${resultId}/${Date.now()}.webp`;

    // Use Blob instead of raw Buffer to avoid binary→text encoding
    // corruption on Vercel's Node.js runtime (Buffer → fetch → UTF-8
    // replacement character expansion for bytes > 0x7F)
    const blob = new Blob([new Uint8Array(webpBuffer)], { type: "image/webp" });

    const { error } = await storage.storage
      .from(BUCKET)
      .upload(path, blob, {
        contentType: "image/webp",
        upsert: true,
      });

    if (error) {
      console.error("[upload-result-image] Storage upload failed:", error.message);
      return NextResponse.json(
        { error: "图片存储失败" },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = storage.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return NextResponse.json({ image_url: publicUrlData.publicUrl });
  } catch (err) {
    console.error("[upload-result-image] Unhandled error:", err);
    return NextResponse.json(
      { error: "图片处理失败" },
      { status: 500 },
    );
  }
}
