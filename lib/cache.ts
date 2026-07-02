import { withTimeout } from "./supabase-timeout";

/* ------------------------------------------------------------------ */
/*  In-memory TTL cache — successful results only                      */
/* ------------------------------------------------------------------ */

type CacheEntry = { value: unknown; expiry: number; swrExpiry?: number };
const store = new Map<string, CacheEntry>();

function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.value as T;
  }
  return undefined;
}

/** Like cacheGet but returns stale entries within the SWR window */
function cacheGetSWR<T>(key: string): { value: T; stale: boolean } | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  const now = Date.now();
  if (now < entry.expiry) return { value: entry.value as T, stale: false };
  if (entry.swrExpiry && now < entry.swrExpiry) return { value: entry.value as T, stale: true };
  return undefined;
}

function cacheSet<T>(key: string, value: T, ttlSeconds: number, swrSeconds?: number): void {
  const now = Date.now();
  const entry: CacheEntry = { value, expiry: now + ttlSeconds * 1000 };
  if (swrSeconds) entry.swrExpiry = now + (ttlSeconds + swrSeconds) * 1000;
  store.set(key, entry);
}

/** Track in-flight background refreshes to avoid duplicate work */
const refreshing = new Set<string>();

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

/** List query with stale-while-revalidate.
 *  On cache expiry: serves stale data immediately, refreshes in background.
 *  Only blocks (waits for network) on complete cache miss. */
export function swrListQuery<T>(
  label: string,
  rawFn: () => Promise<T[]>,
  ttlSeconds: number,
  swrSeconds: number,
  timeoutMs = DEFAULT_TIMEOUT,
): () => Promise<T[]> {
  return async () => {
    const hit = cacheGetSWR<T[]>(label);

    // Fresh cache — return immediately
    if (hit && !hit.stale) return hit.value;

    // Stale but within SWR window — return stale, refresh in background
    if (hit && hit.stale) {
      if (!refreshing.has(label)) {
        refreshing.add(label);
        rawFn()
          .then((data) => cacheSet(label, data, ttlSeconds, swrSeconds))
          .catch(() => {}) // swallow — keep stale data for next request
          .finally(() => refreshing.delete(label));
      }
      return hit.value;
    }

    // Complete miss — must wait for network
    return withTimeout(
      async () => {
        const data = await rawFn();
        cacheSet(label, data, ttlSeconds, swrSeconds);
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
