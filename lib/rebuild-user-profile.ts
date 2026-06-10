import { supabase } from "./supabase";
import { trackAISuccess, trackAIError } from "@/lib/ai/track-ai-usage";
import { generateAISelfidProfile } from "@/lib/prompts/profile-summary";

/* ================================================================== */
/*  rebuildUserProfile(userId)                                         */
/*                                                                     */
/*  Incremental weighted fusion — reads existing profile, only fuses   */
/*  new reports & quiz_attempts, updates in place.                     */
/*  Safe to call repeatedly — idempotent via created_at / fused flag.  */
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
      // valid Selfid key but not in this group — silently skip
    } else {
      invalidKeys.push(key);
    }
  }
  return { dims, invalidKeys };
}

/**
 * Read a dimension from existing user_profile.
 * Handles both flat-number format (legacy) and DimOut object format.
 */
function readOldDim(raw: unknown): DimOut | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { value: raw, count: 1, confidence: 0.5 };
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const value = toNum(obj.value);
    if (value === null) return null;
    return {
      value,
      count: toNum(obj.count) ?? 1,
      confidence: toNum(obj.confidence) ?? 0.5,
    };
  }
  return null;
}

/**
 * Incremental weighted fusion for a single dimension.
 *
 *   new_value    = (old.value * old.count + incoming.value * weight) / (old.count + weight)
 *   new_count    = old.count + weight
 *   new_conf     = (old.confidence * old.count + weight * weight) / (old.count + weight)
 *
 * For both reports and quiz_attempts, the per-source confidence equals the weight,
 * so `weight` serves double duty in the confidence numerator.
 */
function fuseDim(old: DimOut, value: number, weight: number): DimOut {
  const newCount = old.count + weight;
  return {
    value: Number(((old.value * old.count + value * weight) / newCount).toFixed(2)),
    count: Number(newCount.toFixed(2)),
    confidence: Number(((old.confidence * old.count + weight * weight) / newCount).toFixed(2)),
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

  /* ---- 1. Read existing user_profile ---- */

  let oldProfile: Record<string, unknown> | null = null;
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn(`[ProfileRebuild] read existing profile failed: ${error.message}`);
    } else if (data) {
      oldProfile = data as Record<string, unknown>;
    }
  } catch (err) {
    console.warn("[ProfileRebuild] read existing profile threw", err);
  }

  const oldUpdatedAt = oldProfile?.updated_at as string | undefined;
  const oldReportCount = (oldProfile?.report_count as number) ?? 0;

  const oldCoreObj = normalizeJsonb(oldProfile?.core_vector) ?? {};
  const oldSocialObj = normalizeJsonb(oldProfile?.social_vector) ?? {};

  const oldCore: Record<string, DimOut> = {};
  for (const key of CORE_KEYS) {
    const dim = readOldDim(oldCoreObj[key]);
    if (dim) oldCore[key] = dim;
  }
  const oldSocial: Record<string, DimOut> = {};
  for (const key of SOCIAL_KEYS) {
    const dim = readOldDim(oldSocialObj[key]);
    if (dim) oldSocial[key] = dim;
  }

  console.log(`[ProfileRebuild] existing profile: ${oldProfile ? "found" : "not found"}`);
  console.log(`[ProfileRebuild] old report_count: ${oldReportCount}`);
  console.log(`[ProfileRebuild] old core keys: [${Object.keys(oldCore).join(", ") || "(none)"}]`);
  console.log(`[ProfileRebuild] old social keys: [${Object.keys(oldSocial).join(", ") || "(none)"}]`);

  /* ---- 2. Read NEW reports (created after last profile update) ---- */

  let newReportRows: Record<string, unknown>[] = [];
  try {
    let query = supabase
      .from("reports")
      .select("id, core_vector, social_vector, normalized_confidence, confidence, raw_ai_response, main_result, created_at")
      .eq("user_id", userId)
      .eq("parse_status", "normalized");

    if (oldUpdatedAt) {
      query = query.gt("created_at", oldUpdatedAt);
    }

    const { data, error } = await query;
    if (error) {
      console.warn(`[ProfileRebuild] reports query failed: ${error.message}`);
    } else {
      newReportRows = (data ?? []) as Record<string, unknown>[];
    }
  } catch (err) {
    console.warn("[ProfileRebuild] reports query threw", err);
  }

  /* ---- 3. Read NEW quiz_attempts (not yet fused) ---- */

  let newAttemptRows: Record<string, unknown>[] = [];
  try {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, final_result_name, user_vector, profile_weight, created_at")
      .eq("user_id", userId)
      .eq("included_in_profile", true)
      .eq("fused_into_profile", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn(`[ProfileRebuild] quiz_attempts query failed: ${error.message}`);
    } else {
      newAttemptRows = (data ?? []) as Record<string, unknown>[];
    }
  } catch (err) {
    console.warn("[ProfileRebuild] quiz_attempts query threw", err);
  }

  // Deduplicate: latest per quiz_id
  const seen = new Set<string>();
  const newAttempts: Record<string, unknown>[] = [];
  for (const r of newAttemptRows) {
    const qid = r.quiz_id as string;
    if (!qid || seen.has(qid)) continue;
    seen.add(qid);
    newAttempts.push(r);
  }

  console.log(`[ProfileRebuild] new reports count: ${newReportRows.length}`);
  console.log(`[ProfileRebuild] new quiz attempts count: ${newAttempts.length} (total unfused: ${newAttemptRows.length})`);

  /* ---- 4. No new sources → skip ---- */

  if (newReportRows.length === 0 && newAttempts.length === 0) {
    console.log("[ProfileRebuild] NO_NEW_SOURCES — user_profile unchanged");
    return { ok: false, reason: "NO_NEW_SOURCES" };
  }

  /* ---- 5. Start from existing dims ---- */

  const core_vector: Record<string, DimOut> = {};
  for (const key of CORE_KEYS) {
    if (oldCore[key]) core_vector[key] = { ...oldCore[key] };
  }
  const social_vector: Record<string, DimOut> = {};
  for (const key of SOCIAL_KEYS) {
    if (oldSocial[key]) social_vector[key] = { ...oldSocial[key] };
  }

  /* ---- 6. Fuse new reports ---- */

  let reportsUsed = 0;

  for (let i = 0; i < newReportRows.length; i++) {
    const r = newReportRows[i];
    const fallbackWeight = reportFallbackWeight(r);

    const coreDims = extractReportDims(r.core_vector, CORE_KEYS, fallbackWeight);
    const socialDims = extractReportDims(r.social_vector, SOCIAL_KEYS, fallbackWeight);

    if (coreDims.size === 0 && socialDims.size === 0) {
      console.warn(`[ProfileRebuild] skipping report[${r.id}] — no valid Selfid keys`);
      continue;
    }

    for (const [key, c] of coreDims) {
      const old = core_vector[key] ?? { value: 0, count: 0, confidence: 0 };
      core_vector[key] = fuseDim(old, c.value, c.weight);
    }
    for (const [key, c] of socialDims) {
      const old = social_vector[key] ?? { value: 0, count: 0, confidence: 0 };
      social_vector[key] = fuseDim(old, c.value, c.weight);
    }
    reportsUsed++;
  }

  /* ---- 7. Fuse new quiz_attempts ---- */

  let attemptsUsed = 0;
  const fusedAttemptIds: string[] = [];

  for (const row of newAttempts) {
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
      console.warn(`[ProfileRebuild] skipping quiz_attempt[${row.id}] — no valid Selfid keys`);
      continue;
    }

    for (const [key, c] of core.dims) {
      const old = core_vector[key] ?? { value: 0, count: 0, confidence: 0 };
      core_vector[key] = fuseDim(old, c.value, c.weight);
    }
    for (const [key, c] of social.dims) {
      const old = social_vector[key] ?? { value: 0, count: 0, confidence: 0 };
      social_vector[key] = fuseDim(old, c.value, c.weight);
    }
    attemptsUsed++;
    if (row.id) fusedAttemptIds.push(row.id as string);
  }

  /* ---- 8. Log per-dimension changes ---- */

  for (const key of CORE_KEYS) {
    const old = oldCore[key];
    const cur = core_vector[key];
    if (old && cur) {
      console.log(
        `[ProfileRebuild] dim "core.${key}": old_value=${old.value} new_value=${cur.value} ` +
        `weight=${cur.count} new_count=${cur.count} new_confidence=${cur.confidence}`,
      );
    } else if (cur) {
      console.log(
        `[ProfileRebuild] dim "core.${key}": NEW — value=${cur.value} weight=${cur.count} ` +
        `new_count=${cur.count} new_confidence=${cur.confidence}`,
      );
    }
  }
  for (const key of SOCIAL_KEYS) {
    const old = oldSocial[key];
    const cur = social_vector[key];
    if (old && cur) {
      console.log(
        `[ProfileRebuild] dim "social.${key}": old_value=${old.value} new_value=${cur.value} ` +
        `weight=${cur.count} new_count=${cur.count} new_confidence=${cur.confidence}`,
      );
    } else if (cur) {
      console.log(
        `[ProfileRebuild] dim "social.${key}": NEW — value=${cur.value} weight=${cur.count} ` +
        `new_count=${cur.count} new_confidence=${cur.confidence}`,
      );
    }
  }

  /* ---- 9. Collect result names for AI context ---- */

  const recentResults: string[] = [];
  for (const r of newReportRows) {
    const name = r.main_result as string | undefined;
    if (name) recentResults.push(name);
  }
  for (const a of newAttempts) {
    const name = a.final_result_name as string | undefined;
    if (name && !recentResults.includes(name)) recentResults.push(name);
  }

  /* ---- 10. Cumulative report_count ---- */

  const newReportCount = oldReportCount + reportsUsed + attemptsUsed;
  console.log(
    `[ProfileRebuild] report_count: ${oldReportCount} → ${newReportCount} ` +
    `(+${reportsUsed} reports, +${attemptsUsed} attempts)`,
  );

  /* ---- 11. Generate labels (rule-based fallback) ---- */

  const { selfid_profile: fallbackProfile, summary } = generateProfileLabel(core_vector, social_vector);
  let selfid_profile = fallbackProfile;

  /* ---- 12. AI summary (best-effort, non-blocking) ---- */

  try {
    const topCore = Object.entries(core_vector)
      .sort(([, a], [, b]) => Math.abs(b.value - 50) - Math.abs(a.value - 50))
      .slice(0, 4)
      .map(([key, dim]) => ({ label: CORE_CN[key] ?? key, value: Math.round(dim.value) }));

    const topSocial = Object.entries(social_vector)
      .sort(([, a], [, b]) => Math.abs(b.value - 50) - Math.abs(a.value - 50))
      .slice(0, 4)
      .map(([key, dim]) => ({ label: SOCIAL_CN[key] ?? key, value: Math.round(dim.value) }));

    const aiResult = await generateAISelfidProfile(
      topCore,
      topSocial,
      recentResults,
      newReportCount,
      userId,
    );

    if (aiResult.text) {
      selfid_profile = aiResult.text;
      trackAISuccess({
        userId,
        feature: "profile_summary",
        model: "deepseek-chat",
        ...aiResult.tokens,
        metadata: {
          input_trait_count: topCore.length + topSocial.length,
          tag_count: recentResults.length,
          source: "profile_rebuild",
        },
      });
    } else {
      trackAIError({
        userId,
        feature: "profile_summary",
        model: "deepseek-chat",
        errorMessage: "AI returned empty or failed",
        metadata: { source: "profile_rebuild" },
      });
    }
  } catch (err) {
    console.warn("[ProfileRebuild] AI summary failed, using fallback:", err);
  }

  console.log(`[ProfileRebuild] selfid_profile: "${selfid_profile}"`);

  /* ---- 13. Upsert ---- */

  const { error: upsertError } = await supabase.from("user_profile").upsert(
    {
      user_id: userId,
      core_vector,
      social_vector,
      selfid_profile,
      summary,
      report_count: newReportCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    console.error(`[ProfileRebuild] upsert failed: ${upsertError.message}`);
    throw new Error(`用户档案更新失败：${upsertError.message}`);
  }

  console.log(`[ProfileRebuild] upsert success — user_id=${userId} report_count=${newReportCount}`);

  /* ---- 12. Mark quiz_attempts as fused ---- */

  if (fusedAttemptIds.length > 0) {
    const { error: fuseError } = await supabase
      .from("quiz_attempts")
      .update({ fused_into_profile: true })
      .in("id", fusedAttemptIds);

    if (fuseError) {
      console.warn(`[ProfileRebuild] mark fused failed (non-fatal): ${fuseError.message}`);
    } else {
      console.log(`[ProfileRebuild] marked ${fusedAttemptIds.length} quiz_attempt(s) as fused`);
    }
  }

  return { ok: true, report_count: newReportCount };
}

/* ================================================================== */
/*  rebuildUserProfileFromAllSources(userId)                            */
/*                                                                      */
/*  FULL rebuild — used after deletion to recompute from ALL remaining  */
/*  data. Starts from empty, reads every report and quiz_attempt, and   */
/*  fuses everything from scratch.                                      */
/*                                                                      */
/*  If no sources remain → resets to empty/initial profile.             */
/* ================================================================== */

export async function rebuildUserProfileFromAllSources(userId: string): Promise<RebuildResult> {
  console.log(`[ProfileRebuild-Full] start userId: ${userId}`);

  /* ---- 1. Read ALL reports ---- */

  let allReportRows: Record<string, unknown>[] = [];
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("id, core_vector, social_vector, normalized_confidence, confidence, raw_ai_response, main_result, created_at")
      .eq("user_id", userId)
      .eq("parse_status", "normalized");

    if (error) {
      console.warn(`[ProfileRebuild-Full] reports query failed: ${error.message}`);
    } else {
      allReportRows = (data ?? []) as Record<string, unknown>[];
    }
  } catch (err) {
    console.warn("[ProfileRebuild-Full] reports query threw", err);
  }

  /* ---- 2. Read ALL quiz_attempts ---- */

  let allAttemptRows: Record<string, unknown>[] = [];
  try {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, final_result_name, user_vector, profile_weight, created_at")
      .eq("user_id", userId)
      .eq("included_in_profile", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn(`[ProfileRebuild-Full] quiz_attempts query failed: ${error.message}`);
    } else {
      allAttemptRows = (data ?? []) as Record<string, unknown>[];
    }
  } catch (err) {
    console.warn("[ProfileRebuild-Full] quiz_attempts query threw", err);
  }

  // Deduplicate: latest per quiz_id
  const seen = new Set<string>();
  const allAttempts: Record<string, unknown>[] = [];
  for (const r of allAttemptRows) {
    const qid = r.quiz_id as string;
    if (!qid || seen.has(qid)) continue;
    seen.add(qid);
    allAttempts.push(r);
  }

  console.log(`[ProfileRebuild-Full] reports: ${allReportRows.length}, quiz_attempts: ${allAttempts.length}`);

  /* ---- 3. No sources → reset to empty/initial profile ---- */

  if (allReportRows.length === 0 && allAttempts.length === 0) {
    console.log("[ProfileRebuild-Full] no sources — resetting to empty profile");

    const emptyCore: Record<string, DimOut> = {};
    const emptySocial: Record<string, DimOut> = {};

    const { error: upsertError } = await supabase.from("user_profile").upsert(
      {
        user_id: userId,
        core_vector: emptyCore,
        social_vector: emptySocial,
        selfid_profile: "待完善的人格画像",
        summary: "目前还没有足够的数据生成个人图谱。",
        report_count: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (upsertError) {
      console.error(`[ProfileRebuild-Full] empty upsert failed: ${upsertError.message}`);
      throw new Error(`用户档案重置失败：${upsertError.message}`);
    }

    // Reset all quiz_attempts fused flag so incremental rebuild can pick them up later
    if (allAttemptRows.length > 0) {
      const ids = allAttemptRows.map((r) => r.id).filter(Boolean) as string[];
      if (ids.length > 0) {
        await supabase
          .from("quiz_attempts")
          .update({ fused_into_profile: false })
          .in("id", ids);
      }
    }

    return { ok: true, report_count: 0 };
  }

  /* ---- 4. Start from empty dims ---- */

  const core_vector: Record<string, DimOut> = {};
  const social_vector: Record<string, DimOut> = {};

  /* ---- 5. Fuse all reports ---- */

  let reportsUsed = 0;

  for (const r of allReportRows) {
    const fallbackWeight = reportFallbackWeight(r);

    const coreDims = extractReportDims(r.core_vector, CORE_KEYS, fallbackWeight);
    const socialDims = extractReportDims(r.social_vector, SOCIAL_KEYS, fallbackWeight);

    if (coreDims.size === 0 && socialDims.size === 0) {
      console.warn(`[ProfileRebuild-Full] skipping report[${r.id}] — no valid Selfid keys`);
      continue;
    }

    for (const [key, c] of coreDims) {
      const old = core_vector[key] ?? { value: 0, count: 0, confidence: 0 };
      core_vector[key] = fuseDim(old, c.value, c.weight);
    }
    for (const [key, c] of socialDims) {
      const old = social_vector[key] ?? { value: 0, count: 0, confidence: 0 };
      social_vector[key] = fuseDim(old, c.value, c.weight);
    }
    reportsUsed++;
  }

  /* ---- 6. Fuse all quiz_attempts ---- */

  let attemptsUsed = 0;
  const fusedAttemptIds: string[] = [];

  for (const row of allAttempts) {
    const uv = normalizeJsonb(row.user_vector);
    if (!uv) {
      console.warn(`[ProfileRebuild-Full] skipping quiz_attempt[${row.id}] — user_vector null`);
      continue;
    }

    const weight = toNum(row.profile_weight) ?? 0.3;

    const core = extractQuizDims(uv, CORE_KEYS, weight);
    const social = extractQuizDims(uv, SOCIAL_KEYS, weight);

    const allInvalid = [...core.invalidKeys, ...social.invalidKeys];
    if (allInvalid.length > 0) {
      console.warn(
        `[ProfileRebuild-Full] quiz_attempt[${row.id}] invalid keys skipped: [${allInvalid.join(", ")}]`,
      );
    }

    if (core.dims.size === 0 && social.dims.size === 0) {
      console.warn(`[ProfileRebuild-Full] skipping quiz_attempt[${row.id}] — no valid Selfid keys`);
      continue;
    }

    for (const [key, c] of core.dims) {
      const old = core_vector[key] ?? { value: 0, count: 0, confidence: 0 };
      core_vector[key] = fuseDim(old, c.value, c.weight);
    }
    for (const [key, c] of social.dims) {
      const old = social_vector[key] ?? { value: 0, count: 0, confidence: 0 };
      social_vector[key] = fuseDim(old, c.value, c.weight);
    }
    attemptsUsed++;
    if (row.id) fusedAttemptIds.push(row.id as string);
  }

  const newReportCount = reportsUsed + attemptsUsed;
  console.log(
    `[ProfileRebuild-Full] fused ${reportsUsed} reports + ${attemptsUsed} quiz_attempts = ${newReportCount} total`,
  );

  /* ---- 7. Collect result names for AI context ---- */

  const recentResults: string[] = [];
  for (const r of allReportRows) {
    const name = r.main_result as string | undefined;
    if (name) recentResults.push(name);
  }
  for (const a of allAttempts) {
    const name = a.final_result_name as string | undefined;
    if (name && !recentResults.includes(name)) recentResults.push(name);
  }

  /* ---- 8. Generate labels (rule-based fallback) ---- */

  const { selfid_profile: fallbackProfile, summary } = generateProfileLabel(core_vector, social_vector);
  let selfid_profile = fallbackProfile;

  /* ---- 9. AI summary (best-effort, non-blocking) ---- */

  try {
    const topCore = Object.entries(core_vector)
      .sort(([, a], [, b]) => Math.abs(b.value - 50) - Math.abs(a.value - 50))
      .slice(0, 4)
      .map(([key, dim]) => ({ label: CORE_CN[key] ?? key, value: Math.round(dim.value) }));

    const topSocial = Object.entries(social_vector)
      .sort(([, a], [, b]) => Math.abs(b.value - 50) - Math.abs(a.value - 50))
      .slice(0, 4)
      .map(([key, dim]) => ({ label: SOCIAL_CN[key] ?? key, value: Math.round(dim.value) }));

    const aiResult = await generateAISelfidProfile(
      topCore,
      topSocial,
      recentResults,
      newReportCount,
      userId,
    );

    if (aiResult.text) {
      selfid_profile = aiResult.text;
      trackAISuccess({
        userId,
        feature: "profile_summary",
        model: "deepseek-chat",
        ...aiResult.tokens,
        metadata: {
          input_trait_count: topCore.length + topSocial.length,
          tag_count: recentResults.length,
          source: "profile_rebuild_full",
        },
      });
    } else {
      trackAIError({
        userId,
        feature: "profile_summary",
        model: "deepseek-chat",
        errorMessage: "AI returned empty or failed",
        metadata: { source: "profile_rebuild_full" },
      });
    }
  } catch (err) {
    console.warn("[ProfileRebuild-Full] AI summary failed, using fallback:", err);
  }

  console.log(`[ProfileRebuild-Full] selfid_profile: "${selfid_profile}"`);

  /* ---- 10. Upsert ---- */

  const { error: upsertError } = await supabase.from("user_profile").upsert(
    {
      user_id: userId,
      core_vector,
      social_vector,
      selfid_profile,
      summary,
      report_count: newReportCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    console.error(`[ProfileRebuild-Full] upsert failed: ${upsertError.message}`);
    throw new Error(`用户档案更新失败：${upsertError.message}`);
  }

  console.log(`[ProfileRebuild-Full] upsert success — user_id=${userId} report_count=${newReportCount}`);

  /* ---- 9. Mark quiz_attempts as fused ---- */

  if (fusedAttemptIds.length > 0) {
    const { error: fuseError } = await supabase
      .from("quiz_attempts")
      .update({ fused_into_profile: true })
      .in("id", fusedAttemptIds);

    if (fuseError) {
      console.warn(`[ProfileRebuild-Full] mark fused failed (non-fatal): ${fuseError.message}`);
    } else {
      console.log(`[ProfileRebuild-Full] marked ${fusedAttemptIds.length} quiz_attempt(s) as fused`);
    }
  }

  return { ok: true, report_count: newReportCount };
}
