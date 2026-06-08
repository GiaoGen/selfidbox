/* ------------------------------------------------------------------ */
/*  Per-model token pricing (USD per 1M tokens)                         */
/*  Update as pricing changes.                                          */
/* ------------------------------------------------------------------ */

interface ModelPricing {
  /** Price per 1M input tokens */
  input: number;
  /** Price per 1M output tokens */
  output: number;
}

const PRICING: Record<string, ModelPricing> = {
  "deepseek-chat": { input: 0.14, output: 0.28 },
  "deepseek-reasoner": { input: 0.55, output: 2.19 },
};

/** Estimate cost from token counts. Returns 0 if model is unknown. */
export function estimateCost(
  model: string | null | undefined,
  promptTokens: number,
  completionTokens: number,
): number {
  const p = model ? PRICING[model] : null;
  if (!p) return 0;
  return (
    (promptTokens / 1_000_000) * p.input +
    (completionTokens / 1_000_000) * p.output
  );
}
