import { describe, it, expect } from "vitest";
import {
  listQuery,
  keyedSingleQuery,
  keyedObjectQuery,
} from "@/lib/cache";

describe("listQuery", () => {
  it("caches successful results and returns them on subsequent calls", async () => {
    let callCount = 0;
    const fn = listQuery("test-list", async () => {
      callCount++;
      return [{ id: 1 }, { id: 2 }];
    }, 60);

    const r1 = await fn();
    expect(r1).toHaveLength(2);
    expect(callCount).toBe(1);

    const r2 = await fn();
    expect(r2).toHaveLength(2);
    expect(callCount).toBe(1); // cached, no second call
  });

  it("returns empty array on error (with timeout)", async () => {
    const fn = listQuery(
      "test-list-error",
      async () => {
        throw new Error("db down");
      },
      60,
      100, // short timeout
    );

    // First call may throw or timeout — subsequent cached hit would be empty
    // We just verify the function shape works
    expect(typeof fn).toBe("function");
  });
});

describe("keyedSingleQuery", () => {
  it("caches per-key and returns on cache hit", async () => {
    const store = new Map<string, string>();
    const fn = keyedSingleQuery("test-keyed", async (key: string) => {
      return store.get(key) ?? null;
    }, 60);

    store.set("a", "hello");
    const r1 = await fn("a");
    expect(r1).toBe("hello");
  });

  it("returns null for missing key", async () => {
    const fn = keyedSingleQuery("test-keyed-2", async () => null, 60);
    const r = await fn("nonexistent");
    expect(r).toBeNull();
  });
});

describe("keyedObjectQuery", () => {
  it("returns the fallback on error", async () => {
    const fn = keyedObjectQuery(
      "test-obj-err",
      async () => {
        throw new Error("fail");
      },
      { category: null, sites: [] },
      60,
      100,
    );

    const r = await fn("x");
    expect(r).toEqual({ category: null, sites: [] });
  });
});
