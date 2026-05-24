/* ------------------------------------------------------------------ */
/*  Supabase query timeout wrapper                                     */
/* ------------------------------------------------------------------ */

const DEFAULT_TIMEOUT = 8000;

function stripSecrets(msg: string): string {
  // remove long token-like strings (API keys, JWTs) from error messages
  return msg.replace(/[A-Za-z0-9+/=_-]{24,}/g, "***");
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  fallback: T,
  label: string,
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const race = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new DOMException(`Timeout after ${timeoutMs}ms`, "TimeoutError")),
      timeoutMs,
    );
  });

  try {
    const result = await Promise.race([fn(), race]);
    clearTimeout(timer!);
    return result;
  } catch (err: unknown) {
    clearTimeout(timer!);
    const e = err as Error & { details?: string; code?: string };
    const isTimeout =
      e?.name === "TimeoutError" || String(e?.message ?? "").includes("Timeout");

    console.error(
      `[${label}] ${isTimeout ? "timeout" : "failed"}`,
      {
        message: stripSecrets(e?.message ?? String(err)),
        ...(isTimeout ? { timeoutMs } : {}),
      },
    );

    // swallow late rejections from the underlying query
    fn().catch(() => {});

    return fallback;
  }
}
