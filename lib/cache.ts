import { withTimeout } from "./supabase-timeout";

/* ------------------------------------------------------------------ */
/*  In-memory TTL cache — successful results only                      */
/* ------------------------------------------------------------------ */

const store = new Map<string, { value: unknown; expiry: number }>();

function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.value as T;
  }
  return undefined;
}

function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
}

const DEFAULT_TIMEOUT = 8000;

/* ------------------------------------------------------------------ */
/*  No-argument queries                                                */
/* ------------------------------------------------------------------ */

/** List query (no args): cache successes, timeout → [] */
export function listQuery<T>(
  label: string,
  rawFn: () => Promise<T[]>,
  ttlSeconds: number,
  timeoutMs = DEFAULT_TIMEOUT,
): () => Promise<T[]> {
  return async () => {
    const hit = cacheGet<T[]>(label);
    if (hit) return hit;

    return withTimeout(
      async () => {
        const data = await rawFn();
        cacheSet(label, data, ttlSeconds);
        return data;
      },
      [],
      label,
      timeoutMs,
    );
  };
}

/** Single query (no args): cache successes, timeout → null */
export function singleQuery<T>(
  label: string,
  rawFn: () => Promise<T | null>,
  ttlSeconds: number,
  timeoutMs = DEFAULT_TIMEOUT,
): () => Promise<T | null> {
  return async () => {
    const hit = cacheGet<T | null>(label);
    if (hit !== undefined) return hit;

    return withTimeout(
      async () => {
        const data = await rawFn();
        cacheSet(label, data, ttlSeconds);
        return data;
      },
      null,
      label,
      timeoutMs,
    );
  };
}

/* ------------------------------------------------------------------ */
/*  Keyed queries (one string argument)                                */
/* ------------------------------------------------------------------ */

function cacheKey(label: string, key: string): string {
  return `${label}::${key}`;
}

/** Keyed single query: cache successes per-key, timeout → null */
export function keyedSingleQuery<T>(
  label: string,
  rawFn: (key: string) => Promise<T | null>,
  ttlSeconds: number,
  timeoutMs = DEFAULT_TIMEOUT,
): (key: string) => Promise<T | null> {
  return async (key: string) => {
    const ck = cacheKey(label, key);
    const hit = cacheGet<T | null>(ck);
    if (hit !== undefined) return hit;

    return withTimeout(
      async () => {
        const data = await rawFn(key);
        cacheSet(ck, data, ttlSeconds);
        return data;
      },
      null,
      label,
      timeoutMs,
    );
  };
}

/** Keyed object query: cache successes per-key, timeout → fallback */
export function keyedObjectQuery<T>(
  label: string,
  rawFn: (key: string) => Promise<T>,
  fallback: T,
  ttlSeconds: number,
  timeoutMs = DEFAULT_TIMEOUT,
): (key: string) => Promise<T> {
  return async (key: string) => {
    const ck = cacheKey(label, key);
    const hit = cacheGet<T>(ck);
    if (hit !== undefined) return hit;

    return withTimeout(
      async () => {
        const data = await rawFn(key);
        cacheSet(ck, data, ttlSeconds);
        return data;
      },
      fallback,
      label,
      timeoutMs,
    );
  };
}

/** Timeout-only (no cache), no args */
export function timeoutOnly<T>(
  label: string,
  rawFn: () => Promise<T>,
  fallback: T,
  timeoutMs = DEFAULT_TIMEOUT,
): () => Promise<T> {
  return () => withTimeout(rawFn, fallback, label, timeoutMs);
}
