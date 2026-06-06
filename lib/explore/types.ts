/* ------------------------------------------------------------------ */
/*  Unified Explore Card — test_sites + quizzes                        */
/* ------------------------------------------------------------------ */

export type ExploreSource = "official" | "community";

export interface ExploreCard {
  id: string;
  source_type: ExploreSource;
  /** Link target: /test-sites/[id] or /quizzes/[slug] */
  href: string;
  title: string;
  description: string;
  /** cover_image_url — may be empty */
  image: string;
  category_id: string | null;
  categoryLabel: string;
  featured: boolean;
  popularity_score: number;
  created_at: string;
  /** Tags shown on card (test_sites: tags array, quizzes: empty) */
  tags: string[];
  estimatedMinutes: number | null;
  /** Accent key for card background color */
  accent: AccentKey;
}

export type AccentKey = "pink" | "teal" | "lavender" | "peach" | "ochre" | "mint";

export const ACCENT_KEYS: AccentKey[] = [
  "pink",
  "teal",
  "lavender",
  "peach",
  "ochre",
  "mint",
];

/** Deterministic accent from a string (id/slug). Same input → same color. */
export function accentFromId(id: string): AccentKey {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return ACCENT_KEYS[Math.abs(hash) % ACCENT_KEYS.length];
}
