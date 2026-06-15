import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const BUCKET = "quiz-result-images";
const MAX_WIDTH = 800;
const QUALITY = 0.75;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_WIDTH / width);
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context unavailable")); return; }

      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("WebP encoding failed"));
        },
        "image/webp",
        QUALITY,
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadResultImage(
  file: File,
  resultId: string,
): Promise<{ image_url: string }> {
  const compressed = await compressImage(file);

  const path = `${resultId}/${Date.now()}.webp`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      contentType: "image/webp",
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return { image_url: publicUrlData.publicUrl };
}
