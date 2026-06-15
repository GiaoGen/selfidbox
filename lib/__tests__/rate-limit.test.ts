import { describe, it, expect } from "vitest";
import { checkRateLimit, getRateLimitInfo } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests within the limit", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("test-user", 10, 60_000)).toBe(true);
    }
  });

  it("blocks requests after exceeding the limit", () => {
    const key = "blocked-user";
    // exhaust the limit
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60_000);
    }
    // next one should be blocked
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("different keys have independent limits", () => {
    // Exhaust user-a
    for (let i = 0; i < 2; i++) checkRateLimit("user-a", 2, 60_000);
    expect(checkRateLimit("user-a", 2, 60_000)).toBe(false);

    // user-b still has full quota
    expect(checkRateLimit("user-b", 2, 60_000)).toBe(true);
  });
});

describe("getRateLimitInfo", () => {
  it("returns remaining count and future reset time", () => {
    const key = "info-test";
    const info = getRateLimitInfo(key, 10, 60_000);
    expect(info.remaining).toBe(10);
    expect(info.resetAt).toBeGreaterThan(Date.now());
  });
});
