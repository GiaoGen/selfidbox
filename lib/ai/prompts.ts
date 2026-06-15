import { createClient as createSSRClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Create a fresh SSR client per call (reads cookies from current request). */
async function getDb(): Promise<SupabaseClient> {
  return createSSRClient();
}

/* ------------------------------------------------------------------ */
/*  In-memory prompt cache                                              */
/* ------------------------------------------------------------------ */

interface CachedPrompt {
  template: string;
  version: number;
  source: "db" | "fallback";
  cachedAt: number;
}

const promptCache = new Map<string, CachedPrompt>();
const PROMPT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the cached prompt for a given key.
 * Call after admin saves a prompt so the next AI call fetches fresh.
 */
export function clearPromptCache(key: string): void {
  promptCache.delete(key);
  console.log(`[Prompt] cache cleared for key=${key}`);
}

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface AiPromptRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  prompt: string;
  version: number;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export type PromptFetchResult =
  | { ok: true; template: string; version: number }
  | { ok: false; reason: "not_found" | "invalid_db_prompt" };

/* ------------------------------------------------------------------ */
/*  Validation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Check whether a prompt string is valid for use in AI calls.
 * Exported for admin UI warnings.
 */
export function validatePromptContent(
  prompt: string,
): { valid: boolean; reason?: string } {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return { valid: false, reason: "Prompt is empty" };
  }

  if (trimmed.toUpperCase() === "TODO") {
    return { valid: false, reason: "Prompt is placeholder (TODO)" };
  }

  if (trimmed.length < 100) {
    return {
      valid: false,
      reason: `Prompt too short (${trimmed.length} chars, min 100)`,
    };
  }

  return { valid: true };
}

/* ------------------------------------------------------------------ */
/*  DB query helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Fetch an active prompt template from the database by key.
 * Validates the prompt content — returns { ok: false } for invalid prompts.
 */
export async function getPromptTemplate(
  key: string,
): Promise<PromptFetchResult> {
  const supabase = await getDb();
  // 1. Check in-memory cache
  const cached = promptCache.get(key);
  if (cached) {
    const age = Date.now() - cached.cachedAt;
    if (age < PROMPT_CACHE_TTL_MS) {
      if (cached.source === "db") {
        console.log(
          `[Prompt] using cached prompt ${key} v${cached.version}`,
        );
        return {
          ok: true,
          template: cached.template,
          version: cached.version,
        };
      }
      // Negative cache: DB was missing/invalid, skip DB query
      console.log(`[Prompt] using fallback prompt ${key}`);
      return { ok: false, reason: "not_found" };
    }
    // TTL expired — evict and fall through to DB query
    promptCache.delete(key);
  }

  // 2. Query DB
  try {
    const { data, error } = await supabase
      .from("ai_prompts")
      .select("prompt, version")
      .eq("key", key)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      // Cache the miss so we don't re-query DB within TTL
      promptCache.set(key, {
        template: "",
        version: 0,
        source: "fallback",
        cachedAt: Date.now(),
      });
      console.log(`[Prompt] using fallback prompt ${key}`);
      return { ok: false, reason: "not_found" };
    }

    const validation = validatePromptContent(data.prompt as string);

    if (!validation.valid) {
      console.log(
        `[Prompt] invalid db prompt, using fallback key=${key} v=${data.version} reason="${validation.reason}"`,
      );
      // Cache the invalid as a miss — DB needs admin fix
      promptCache.set(key, {
        template: "",
        version: data.version as number,
        source: "fallback",
        cachedAt: Date.now(),
      });
      return { ok: false, reason: "invalid_db_prompt" };
    }

    // Valid DB prompt — cache it
    const template = data.prompt as string;
    const version = data.version as number;
    promptCache.set(key, {
      template,
      version,
      source: "db",
      cachedAt: Date.now(),
    });
    console.log(`[Prompt] loaded db prompt ${key} v${version}`);
    return { ok: true, template, version };
  } catch {
    // Don't cache transient errors — let next call retry DB
    console.log(`[Prompt] using fallback prompt ${key}`);
    return { ok: false, reason: "not_found" };
  }
}

/**
 * Fetch all prompts for admin listing.
 */
export async function getAllPrompts(): Promise<AiPromptRow[]> {
  const supabase = await getDb();
  const { data, error } = await supabase
    .from("ai_prompts")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    console.error("[ai-prompts] getAllPrompts error:", error.message);
    return [];
  }
  return (data as AiPromptRow[]) ?? [];
}

/**
 * Fetch a single prompt by key for admin edit (returns even inactive rows).
 */
export async function getPromptByKey(key: string): Promise<AiPromptRow | null> {
  const supabase = await getDb();
  const { data, error } = await supabase
    .from("ai_prompts")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (error || !data) return null;
  return data as AiPromptRow;
}

/**
 * Upsert a prompt. Updates name, description, prompt, is_active.
 * Increments version and sets updated_at = now().
 */
export async function upsertPrompt(
  key: string,
  updates: {
    name: string;
    description: string | null;
    prompt: string;
    is_active: boolean;
  },
): Promise<void> {
  const supabase = await getDb();
  // Get current version
  const current = await getPromptByKey(key);
  const newVersion = (current?.version ?? 0) + 1;

  const { error } = await supabase.from("ai_prompts").upsert(
    {
      key,
      name: updates.name,
      description: updates.description ?? null,
      prompt: updates.prompt,
      is_active: updates.is_active,
      version: newVersion,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    console.error("[ai-prompts] upsertPrompt error:", error.message);
    throw new Error(`Failed to save prompt: ${error.message}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Template rendering                                                  */
/* ------------------------------------------------------------------ */

/**
 * Simple {{key}} template renderer.
 * No complex template engine — just replace {{key}} with values.
 * Missing variables are replaced with an empty string.
 */
export function renderPrompt(
  template: string,
  variables: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const val = variables[key];
    if (val === undefined || val === null) return "";
    return String(val);
  });
}
