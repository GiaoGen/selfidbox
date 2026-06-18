// Extracted from Nippon_Colors.md — 日本の伝統色
export const NIPPON_COLORS: string[] = [
  // Reds
  "#D7263D",
  "#C44536",
  "#A63D40",

  // Oranges
  "#E76F51",
  "#F08A4B",
  "#C97A40",

  // Yellows
  "#F4D35E",
  "#E9C46A",
  "#DDBB57",

  // Yellow Greens
  "#B8C480",
  "#A7C957",
  "#8FB339",

  // Greens
  "#5B8E55",
  "#4F8B67",
  "#2F6B4F",

  // Teals
  "#3A7D7C",
  "#2A9D8F",
  "#4D908E",

  // Cyans
  "#4EA8DE",
  "#48BFE3",
  "#5390D9",

  // Blues
  "#457B9D",
  "#3A5A98",
  "#1D4ED8",

  // Indigo
  "#5E60CE",
  "#4C5FD5",
  "#4361EE",

  // Purples
  "#6D597A",
  "#7B5EA7",
  "#8E6CBE",

  // Magentas
  "#B56576",
  "#C06C84",
  "#D17B88",

  // Pinks
  "#D98CA8",
  "#E5989B",
  "#F4A7B9",

  // Browns / Earth
  "#8D6E63",
  "#A47148",
  "#B08968",

  // Warm Neutrals
  "#D9CBB8",
  "#E6D5B8",
  "#F2E8CF",

  // Grays
  "#ADB5BD",
  "#868E96",
  "#6C757D",

  // Darks
  "#495057",
  "#343A40",
  "#212529",

  // Lights
  "#FAF9F6",
  "#F7F3E9",
  "#F8F8F4",
];
/* ------------------------------------------------------------------ */
/*  Stable color lookup — same slug → same Nippon color, always       */
/* ------------------------------------------------------------------ */

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministic Nippon color for a slug/id. Same input → same color. */
export function nipponColorForSlug(slug: string): string {
  return NIPPON_COLORS[hashString(slug) % NIPPON_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  Readable text color for a given background                         */
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

/** #1C1C1C for light backgrounds, #FCFAF2 for dark backgrounds */
export function textColorForNipponBg(bg: string): string {
  return luminance(bg) > 0.45 ? "#1C1C1C" : "#FCFAF2";
}
