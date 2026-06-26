/**
 * Browser-side dominant color extraction from an image URL.
 * Uses Canvas API — no external dependencies.
 *
 * Filters out transparent, near-white, near-black, and near-gray pixels.
 * Returns the most frequent color as a hex string, or null on failure.
 */

/** Quantization step per channel — groups similar shades together. */
const QUANT = 32;

/** Thresholds for filtering unwanted pixels */
const WHITE_THRESHOLD = 240; // R,G,B all above this → skip (near white)
const BLACK_THRESHOLD = 20;  // R,G,B all below this → skip (near black)
const GRAY_SATURATION = 30;  // max-min below this → skip (near gray)
const ALPHA_THRESHOLD = 128; // alpha below this → skip (transparent)

/** Sample size — image is resized to this width before sampling. */
const SAMPLE_WIDTH = 50;

function channelKey(v: number): number {
  return Math.round(v / QUANT) * QUANT;
}

export async function extractDominantColor(imageUrl: string): Promise<string | null> {
  try {
    // 1. Load image
    const img = await loadImage(imageUrl);

    // 2. Draw onto small canvas
    const ratio = img.naturalHeight / img.naturalWidth;
    const sampleHeight = Math.round(SAMPLE_WIDTH * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_WIDTH;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, SAMPLE_WIDTH, sampleHeight);

    // 3. Read pixel data
    const imageData = ctx.getImageData(0, 0, SAMPLE_WIDTH, sampleHeight);
    const { data } = imageData;

    // 4. Count quantized colors (key → count)
    const buckets = new Map<string, number>();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent / semi-transparent pixels
      if (a < ALPHA_THRESHOLD) continue;

      // Skip near-white (likely background)
      if (r > WHITE_THRESHOLD && g > WHITE_THRESHOLD && b > WHITE_THRESHOLD) continue;

      // Skip near-black
      if (r < BLACK_THRESHOLD && g < BLACK_THRESHOLD && b < BLACK_THRESHOLD) continue;

      // Skip near-gray (low saturation)
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      if (maxC - minC < GRAY_SATURATION) continue;

      // Quantize and count
      const key = `${channelKey(r)},${channelKey(g)},${channelKey(b)}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    // 5. Find most frequent color
    if (buckets.size === 0) return null;

    let bestKey = "";
    let bestCount = 0;
    for (const [key, count] of buckets) {
      if (count > bestCount) {
        bestCount = count;
        bestKey = key;
      }
    }

    // 6. Convert quantized key back to hex → adjust saturation & lightness
    const parts = bestKey.split(",").map(Number);
    const rawHex = "#" + parts.map((c) => c.toString(16).padStart(2, "0")).join("");

    // 7. Tone down: saturation -30%, lightness -15%
    const hsl = hexToHsl(rawHex);
    const adjusted = hslToHex(hsl.h, hsl.s * 0.7, hsl.l * 0.85);

    return adjusted;
  } catch {
    // Image load failure, CORS, or canvas error — silently fall back
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/* ------------------------------------------------------------------ */
/*  HSL conversion (zero-dependency, pure math)                         */
/* ------------------------------------------------------------------ */

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}
