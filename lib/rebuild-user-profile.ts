import { supabase } from "./supabase";

/* ================================================================== */
/*  rebuildUserProfile(userId)                                         */
/*                                                                     */
/*  The SINGLE function that writes user_profile.                      */
/*  Every call does a full recompute from all source data.             */
/* ================================================================== */

/* ---- constants ---- */

const CORE_KEYS = new Set([
  "social",
  "sensitivity",
  "rationality",
  "curiosity",
  "independence",
  "expressiveness",
  "drive",
  "imagination",
]);

const SOCIAL_KEYS = new Set([
  "assertiveness",
  "security_need",
  "empathy",
  "dramaticness",
  "orderliness",
  "contradiction",
  "attachment",
  "presence",
]);

const ALL_SELFID_KEYS = new Set([...CORE_KEYS, ...SOCIAL_KEYS]);

/* ---- types ---- */

interface DimOut {
  count: number;
  value: number;
  confidence: number;
}

interface DimContrib {
  value: number;
  weight: number;
}

interface RebuildResult {
  ok: boolean;
  report_count?: number;
  reason?: string;
}

/* ---- helpers ---- */

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

/** Normalize jsonb that may arrive as a pre-parsed object or a JSON string. */
function normalizeJsonb(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (p && typeof p === "object" && !Array.isArray(p)) return p as Record<string, unknown>;
    } catch { /* not JSON */ }
  }
  return null;
}

/**
 * Parse a dimension object from reports (handles both formats).
 * Standard:  { value, confidence, count }
 * OCR norm:  { value, confidence, source, evidence, ... }
 */
function parseReportDim(raw: unknown): { value: number; confidence: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const value = toNum(obj.value);
  if (value === null) return null;
  const confidence = toNum(obj.confidence) ?? 0.5;
  return { value, confidence };
}

/**
 * Extract the best weight available for a report, tried in order:
 * report.normalized_confidence → report.confidence →
 * raw_ai_response.overall_confidence → 0.5
 */
function reportFallbackWeight(report: Record<string, unknown>): number {
  const nc = toNum(report.normalized_confidence);
  if (nc !== null) return nc;
  const c = toNum(report.confidence);
  if (c !== null) return c;
  const raw = normalizeJsonb(report.raw_ai_response);
  if (raw) {
    const oc = toNum(raw.overall_confidence);
    if (oc !== null) return oc;
  }
  return 0.5;
}

/**
 * Extract Selfid dimensions from a report's core_vector or social_vector.
 * Returns only keys in `allowed`.
 */
function extractReportDims(
  raw: unknown,
  allowed: Set<string>,
  fallbackWeight: number,
): Map<string, DimContrib> {
  const result = new Map<string, DimContrib>();
  const obj = normalizeJsonb(raw);
  if (!obj) return result;

  for (const key of allowed) {
    const dim = parseReportDim(obj[key]);
    if (!dim) continue;
    const weight = dim.confidence > 0 ? dim.confidence : fallbackWeight;
    result.set(key, { value: dim.value, weight });
  }
  return result;
}

/**
 * Extract Selfid dimensions from a quiz_attempt's flat user_vector.
 */
function extractQuizDims(
  raw: unknown,
  allowed: Set<string>,
  weight: number,
): { dims: Map<string, DimContrib>; invalidKeys: string[] } {
  const dims = new Map<string, DimContrib>();
  const invalidKeys: string[] = [];
  const obj = normalizeJsonb(raw);
  if (!obj) return { dims, invalidKeys };

  for (const [key, val] of Object.entries(obj)) {
    const num = toNum(val);
    if (num === null) continue;
    if (allowed.has(key)) {
      dims.set(key, { value: num, weight });
    } else if (ALL_SELFID_KEYS.has(key)) {
      // valid Selfid key but not in this group — silently skip (it will be picked up by the other group)
    } else {
      invalidKeys.push(key);
    }
  }
  return { dims, invalidKeys };
}

/** Compute final DimOut from accumulated contributions. */
function finalizeDim(contribs: DimContrib[]): DimOut | null {
  if (contribs.length === 0) return null;
  let ws = 0;
  let tw = 0;
  for (const c of contribs) {
    ws += c.value * c.weight;
    tw += c.weight;
  }
  if (tw === 0) return null;
  return {
    value: Number((ws / tw).toFixed(2)),
    confidence: Number(Math.min(1, tw / contribs.length).toFixed(2)),
    count: contribs.length,
  };
}

/* ---- selfid_profile / summary generation (simple, no AI) ---- */

interface TraitInfo {
  key: string;
  label: string;
  value: number;
  group: "core" | "social";
}

function generateProfileLabel(core: Record<string, DimOut>, social: Record<string, DimOut>): {
  selfid_profile: string;
  summary: string;
} {
  const traits: TraitInfo[] = [];

  for (const [key, dim] of Object.entries(core)) {
    traits.push({ key, label: CORE_CN[key] ?? key, value: dim.value, group: "core" });
  }
  for (const [key, dim] of Object.entries(social)) {
    traits.push({ key, label: SOCIAL_CN[key] ?? key, value: dim.value, group: "social" });
  }

  // Sort by deviation from 50 (most distinctive first)
  const sorted = [...traits].sort((a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50));

  // selfid_profile: top 3-4 distinctive traits with direction prefix
  const top = sorted.slice(0, 4);
  const parts = top.map((t) => {
    const dir = t.value >= 65 ? "高" : t.value <= 35 ? "低" : "";
    return dir ? `${dir}${t.label}` : t.label;
  });
  const selfid_profile = parts.join(" · ") || "人格图谱";

  // summary: simple natural-language template
  const topCore = sorted.filter((t) => t.group === "core").slice(0, 3);
  const topSocial = sorted.filter((t) => t.group === "social").slice(0, 3);

  let summary = "";
  if (topCore.length > 0) {
    summary +=
      "核心人格中" +
      topCore.map((t) => `「${t.label}」${t.value >= 50 ? "偏高" : "偏低"}（${t.value}）`).join("、");
  }
  if (topSocial.length > 0) {
    if (summary) summary += "；";
    summary +=
      "社会表达中" +
      topSocial.map((t) => `「${t.label}」${t.value >= 50 ? "偏高" : "偏低"}（${t.value}）`).join("、");
  }
  if (!summary) summary = "人格数据收集中，完成更多测评以丰富你的图谱。";

  return { selfid_profile, summary };
}

const CORE_CN: Record<string, string> = {
  social: "社交性",
  sensitivity: "敏感度",
  rationality: "理性度",
  curiosity: "探索欲",
  independence: "独立性",
  expressiveness: "表达欲",
  drive: "行动力",
  imagination: "幻想度",
};

const SOCIAL_CN: Record<string, string> = {
  assertiveness: "主张性",
  security_need: "安全感需求",
  empathy: "共情力",
  dramaticness: "戏剧性",
  orderliness: "秩序感",
  contradiction: "反差感",
  attachment: "亲密倾向",
  presence: "存在感",
};

/* ================================================================== */
/*  MAIN                                                               */
/* ================================================================== */

export async function rebuildUserProfile(userId: string): Promise<RebuildResult> {
  console.log(`[ProfileRebuild] start userId: ${userId}`);

  /* ---- 1. Read normalized reports ---- */

  let reportRows: Record<string, unknown>[] = [];
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("id, core_vector, social_vector, normalized_confidence, confidence, raw_ai_response")
      .eq("user_id", userId)
      .eq("parse_status", "normalized");

    if (error) {
      console.warn(`[ProfileRebuild] reports query failed: ${error.message}`);
    } else {
      reportRows = (data ?? []) as Record<string, unknown>[];
    }
  } catch (err) {
    console.warn("[ProfileRebuild] reports query threw", err);
  }

  /* ---- 2. Read quiz_attempts (latest per quiz_id) ---- */

  let attemptRows: Record<string, unknown>[] = [];
  try {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, user_vector, profile_weight, created_at")
      .eq("user_id", userId)
      .eq("included_in_profile", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn(`[ProfileRebuild] quiz_attempts query failed: ${error.message}`);
    } else {
      attemptRows = (data ?? []) as Record<string, unknown>[];
    }
  } catch (err) {
    console.warn("[ProfileRebuild] quiz_attempts query threw", err);
  }

  // Deduplicate: latest per quiz_id
  const seen = new Set<string>();
  const latestAttempts: Record<string, unknown>[] = [];
  for (const r of attemptRows) {
    const qid = r.quiz_id as string;
    if (!qid || seen.has(qid)) continue;
    seen.add(qid);
    latestAttempts.push(r);
  }

  console.log(`[ProfileRebuild] reports count: ${reportRows.length}`);
  console.log(`[ProfileRebuild] quiz attempts total count: ${attemptRows.length}`);
  console.log(`[ProfileRebuild] latest quiz attempts count: ${latestAttempts.length}`);

  /* ---- 3. Accumulate per-dimension contributions ---- */

  const accum: Record<string, DimContrib[]> = {};
  for (const key of ALL_SELFID_KEYS) accum[key] = [];

  let reportsUsed = 0;

  for (let i = 0; i < reportRows.length; i++) {
    const r = reportRows[i];
    const fallbackWeight = reportFallbackWeight(r);

    const coreDims = extractReportDims(r.core_vector, CORE_KEYS, fallbackWeight);
    const socialDims = extractReportDims(r.social_vector, SOCIAL_KEYS, fallbackWeight);

    if (coreDims.size === 0 && socialDims.size === 0) {
      console.warn(`[ProfileRebuild] skipping report[${i}] — no valid Selfid keys`);
      continue;
    }

    for (const [key, c] of coreDims) accum[key].push(c);
    for (const [key, c] of socialDims) accum[key].push(c);
    reportsUsed++;
  }

  let attemptsUsed = 0;

  for (const row of latestAttempts) {
    const uv = normalizeJsonb(row.user_vector);
    if (!uv) {
      console.warn(`[ProfileRebuild] skipping quiz_attempt[${row.id}] — user_vector null`);
      continue;
    }

    const weight = toNum(row.profile_weight) ?? 0.3;

    const core = extractQuizDims(uv, CORE_KEYS, weight);
    const social = extractQuizDims(uv, SOCIAL_KEYS, weight);

    const allInvalid = [...core.invalidKeys, ...social.invalidKeys];
    if (allInvalid.length > 0) {
      console.warn(
        `[ProfileRebuild] quiz_attempt[${row.id}] invalid keys skipped: [${allInvalid.join(", ")}]`,
      );
    }

    if (core.dims.size === 0 && social.dims.size === 0) {
      console.warn(
        `[ProfileRebuild] skipping quiz_attempt[${row.id}] — no valid Selfid keys`,
      );
      continue;
    }

    for (const [key, c] of core.dims) accum[key].push(c);
    for (const [key, c] of social.dims) accum[key].push(c);
    attemptsUsed++;
  }

  /* ---- 4. No valid sources → don't touch user_profile ---- */

  if (reportsUsed === 0 && attemptsUsed === 0) {
    console.warn("[ProfileRebuild] NO_VALID_PROFILE_SOURCES — user_profile unchanged");
    return { ok: false, reason: "NO_VALID_PROFILE_SOURCES" };
  }

  /* ---- 5. Finalize per-dimension vectors ---- */

  const core_vector: Record<string, DimOut> = {};
  const social_vector: Record<string, DimOut> = {};

  for (const key of CORE_KEYS) {
    const dim = finalizeDim(accum[key]);
    if (dim) core_vector[key] = dim;
  }
  for (const key of SOCIAL_KEYS) {
    const dim = finalizeDim(accum[key]);
    if (dim) social_vector[key] = dim;
  }

  console.log(
    `[ProfileRebuild] core keys: [${Object.keys(core_vector).join(", ") || "(none)"}]`,
  );
  console.log(
    `[ProfileRebuild] social keys: [${Object.keys(social_vector).join(", ") || "(none)"}]`,
  );

  /* ---- 6. Generate selfid_profile + summary ---- */

  const { selfid_profile, summary } = generateProfileLabel(core_vector, social_vector);

  /* ---- 7. report_count ---- */

  const reportCount = reportsUsed + attemptsUsed;
  console.log(`[ProfileRebuild] final report_count: ${reportCount}`);

  /* ---- 8. Upsert ---- */

  const { error: upsertError } = await supabase.from("user_profile").upsert(
    {
      user_id: userId,
      core_vector,
      social_vector,
      selfid_profile,
      summary,
      report_count: reportCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    console.error(`[ProfileRebuild] upsert failed: ${upsertError.message}`);
    throw new Error(`用户档案更新失败：${upsertError.message}`);
  }

  console.log("[ProfileRebuild] upsert success");
  return { ok: true, report_count: reportCount };
}
