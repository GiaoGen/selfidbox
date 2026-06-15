/**
 * In-memory rate limiter. Simple sliding-window counter per key.
 * For production with multiple instances, replace with Upstash Redis or similar.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/** Clean up expired entries periodically */
function prune() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

// Prune every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(prune, 60_000);
}

/**
 * Check if a key has exceeded the rate limit.
 * Returns `true` if the request is allowed, `false` if rate-limited.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Get remaining requests and reset time for a key.
 * Useful for sending rate-limit headers.
 */
export function getRateLimitInfo(
  key: string,
  maxRequests: number,
  windowMs: number,
): { remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    return { remaining: maxRequests, resetAt: now + windowMs };
  }

  return {
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}
