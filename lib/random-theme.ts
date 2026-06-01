import { NIPPON_COLORS } from "./nippon-colors";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function textColorFor(bg: string): string {
  return luminance(bg) > 0.45 ? "#1C1C1C" : "#FCFAF2";
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = 1 + amount;
  return `rgb(${Math.min(255, Math.round(r * f))},${Math.min(255, Math.round(g * f))},${Math.min(255, Math.round(b * f))})`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/** Pick N diverse colors from a pool using max-min distance */
function pickDiverse(pool: string[], n: number): string[] {
  const shuffled = shuffle(pool);
  const picked: string[] = [shuffled[0]];
  for (let i = 1; i < shuffled.length && picked.length < n; i++) {
    const candidate = shuffled[i];
    const minDist = Math.min(...picked.map((p) => colorDistance(p, candidate)));
    if (minDist > 80) picked.push(candidate);
  }
  // fallback: fill from shuffled if not enough diverse picks
  for (const c of shuffled) {
    if (picked.length >= n) break;
    if (!picked.includes(c)) picked.push(c);
  }
  return picked;
}

/* ------------------------------------------------------------------ */
/*  Theme type                                                         */
/* ------------------------------------------------------------------ */

export interface RandomTheme {
  accent: string;
  accentText: string;
  accentLight: string;
  resultCards: string[];
  validatorGoodBg: string;
  validatorGoodBorder: string;
  validatorGoodText: string;
  validatorWarnBg: string;
  validatorWarnBorder: string;
  validatorWarnText: string;
  metaCardBg: string;
  factorChipBg: string;
  chipBg: string;
  chipText: string;
  sliderColor: string;
}

/* ------------------------------------------------------------------ */
/*  Generator                                                          */
/* ------------------------------------------------------------------ */

export function generateRandomTheme(): RandomTheme {
  const shuffled = shuffle(NIPPON_COLORS);

  // Pick accent: prefer medium-luminance colors (not too dark, not too light)
  const mediumCandidates = shuffled.filter((c) => {
    const l = luminance(c);
    return l > 0.12 && l < 0.55;
  });
  const accent = mediumCandidates.length > 0
    ? mediumCandidates[Math.floor(Math.random() * Math.min(mediumCandidates.length, 20))]
    : shuffled[0];

  // Result cards: 5 diverse colors
  const resultCards = pickDiverse(
    shuffled.filter((c) => c !== accent),
    7,
  );

  // Validator good: pick from green-ish tones
  const greens = shuffled.filter((c) => {
    const [r, g, b] = hexToRgb(c);
    return g > r && g > b && g - Math.max(r, b) > 20;
  });
  const validatorGood = greens.length > 0
    ? greens[Math.floor(Math.random() * greens.length)]
    : "#5DAC81";

  // Validator warn: pick from warm tones
  const warms = shuffled.filter((c) => {
    const [r, g, b] = hexToRgb(c);
    return r > g && r > b && r > 120;
  });
  const validatorWarn = warms.length > 0
    ? warms[Math.floor(Math.random() * warms.length)]
    : "#CA7A2C";

  // Meta card bg: very light neutral
  const lights = shuffled.filter((c) => luminance(c) > 0.75);
  const metaCardBg = lights.length > 0
    ? lights[Math.floor(Math.random() * lights.length)]
    : "#ECE6D8";

  return {
    accent,
    accentText: textColorFor(accent),
    accentLight: lighten(accent, 0.6),
    resultCards,
    validatorGoodBg: `rgb(${hexToRgb(validatorGood).join(",")},0.12)`,
    validatorGoodBorder: `rgb(${hexToRgb(validatorGood).join(",")},0.3)`,
    validatorGoodText: validatorGood,
    validatorWarnBg: `rgb(${hexToRgb(validatorWarn).join(",")},0.1)`,
    validatorWarnBorder: `rgb(${hexToRgb(validatorWarn).join(",")},0.25)`,
    validatorWarnText: validatorWarn,
    metaCardBg,
    factorChipBg: lighten(accent, 0.8),
    chipBg: lighten(accent, 0.7),
    chipText: accent,
    sliderColor: accent,
  };
}
