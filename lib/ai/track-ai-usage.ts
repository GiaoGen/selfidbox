import { supabase } from "@/lib/supabase";
import { estimateCost } from "./model-pricing";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface TrackAICallInput {
  userId?: string | null;
  feature: string;
  model?: string | null;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  success?: boolean;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget: logs usage without blocking or throwing. */
async function logUsage(input: TrackAICallInput): Promise<void> {
  try {
    const total =
      input.totalTokens ??
      (input.promptTokens ?? 0) + (input.completionTokens ?? 0);

    const estimatedCost = estimateCost(
      input.model,
      input.promptTokens ?? 0,
      input.completionTokens ?? 0,
    );

    await supabase.from("ai_usage_logs").insert({
      user_id: input.userId ?? null,
      feature: input.feature,
      model: input.model ?? null,
      prompt_tokens: input.promptTokens ?? 0,
      completion_tokens: input.completionTokens ?? 0,
      total_tokens: total,
      estimated_cost: estimatedCost,
      success: input.success ?? true,
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Silent — never let logging break the caller
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Track a successful AI call. Pass token counts from the API response.
 */
export function trackAISuccess(input: Omit<TrackAICallInput, "success">) {
  // Fire and forget (don't await)
  logUsage({ ...input, success: true });
}

/**
 * Track a failed AI call.
 */
export function trackAIError(input: Omit<TrackAICallInput, "success">) {
  logUsage({ ...input, success: false });
}

/**
 * Extract token usage from a DeepSeek / OpenAI-compatible response body.
 */
export function extractTokens(body: {
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  const u = body.usage;
  const prompt = u?.prompt_tokens ?? 0;
  const completion = u?.completion_tokens ?? 0;
  const total = u?.total_tokens ?? prompt + completion;
  return { promptTokens: prompt, completionTokens: completion, totalTokens: total };
}
