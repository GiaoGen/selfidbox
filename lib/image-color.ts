/**
 * Browser-side dominant color extraction from an image URL.
 * Uses Canvas API — no external dependencies.
 *
 * Filters out transparent, near-white, near-black, and near-gray pixels.
 * Returns the most frequent color as a hex string, or null on failure.
 */

/** Thresholds for filtering unwanted pixels */
const WHITE_THRESHOLD = 240; // R,G,B all above this → skip (near white)
const BLACK_THRESHOLD = 20;  // R,G,B all below this → skip (near black)
const GRAY_SATURATION = 30;  // max-min below this → skip (near gray)
const ALPHA_THRESHOLD = 128; // alpha below this → skip (transparent)
const LOW_SATURATION = 0.15; // HSL saturation below this → skip (near-gray, unreliable hue)

/** Sample size — image is resized to this width before sampling. */
const SAMPLE_WIDTH = 50;

/** 8 hue families, each 45° wide, centered on recognizable hues */
const HUE_FAMILIES = [
  { name: "red",     lo: 337.5, hi: 360, center:   0 },  // also covers 0–22.5 via wrap
  { name: "orange",  lo:  22.5, hi:  67.5, center:  45 },
  { name: "yellow",  lo:  67.5, hi: 112.5, center:  90 },
  { name: "green",   lo: 112.5, hi: 157.5, center: 135 },
  { name: "cyan",    lo: 157.5, hi: 202.5, center: 180 },
  { name: "blue",    lo: 202.5, hi: 247.5, center: 225 },
  { name: "purple",  lo: 247.5, hi: 292.5, center: 270 },
  { name: "magenta", lo: 292.5, hi: 337.5, center: 315 },
] as const;

function getHueFamily(h: number): number {
  // h is in [0, 1], convert to degrees
  const deg = h * 360;
  // Red wraps around: 337.5–360 and 0–22.5 both map to family 0
  if (deg >= 337.5 || deg < 22.5) return 0;
  for (let i = 1; i < HUE_FAMILIES.length; i++) {
    if (deg >= HUE_FAMILIES[i].lo && deg < HUE_FAMILIES[i].hi) return i;
  }
  return 0; // fallback (should never reach)
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

    // 4. Group pixels into hue families — count + store S/L for representative pick
    const families: { count: number; saturations: number[]; lightnesses: number[] }[] =
      Array.from({ length: HUE_FAMILIES.length }, () => ({
        count: 0,
        saturations: [] as number[],
        lightnesses: [] as number[],
      }));

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

      // Skip near-gray (low RGB saturation)
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      if (maxC - minC < GRAY_SATURATION) continue;

      // Convert to HSL to get perceptually meaningful hue
      const { h, s, l } = rgbToHsl(r, g, b);

      // Skip very low saturation (gray-ish, hue is unreliable)
      if (s < LOW_SATURATION) continue;

      const family = getHueFamily(h);
      families[family].count++;
      families[family].saturations.push(s);
      families[family].lightnesses.push(l);
    }

    // 5. Find the hue family with the most pixels
    let bestFamily = -1;
    let bestCount = 0;
    for (let i = 0; i < families.length; i++) {
      if (families[i].count > bestCount) {
        bestCount = families[i].count;
        bestFamily = i;
      }
    }

    if (bestFamily === -1) return null;

    // 6. Pick a representative color from the winning family:
    //    median saturation + median lightness + the family's center hue
    const winner = families[bestFamily];
    const sortedS = winner.saturations.slice().sort((a, b) => a - b);
    const sortedL = winner.lightnesses.slice().sort((a, b) => a - b);
    const medianS = sortedS[Math.floor(sortedS.length / 2)];
    const medianL = sortedL[Math.floor(sortedL.length / 2)];
    const centerH = HUE_FAMILIES[bestFamily].center / 360;

    // 7. Tone down: saturation -30%, lightness -15%
    const adjusted = hslToHex(centerH, medianS * 0.7, Math.max(0.05, medianL * 0.85));

    return adjusted;
  } catch {
    // Image load failure, CORS, or canvas error — silently fall back
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function clamp(v: number): number {
  return Math.min(255, Math.max(0, v));
}

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

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

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

  const r = clamp(Math.round(hue2rgb(p, q, h + 1 / 3) * 255));
  const g = clamp(Math.round(hue2rgb(p, q, h) * 255));
  const b = clamp(Math.round(hue2rgb(p, q, h - 1 / 3) * 255));

  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}
