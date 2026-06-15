import { describe, it, expect } from "vitest";
import { resolveStyleStrategy } from "@/lib/prompts/quiz-questions";

describe("resolveStyleStrategy", () => {
  it("maps very_low band correctly (0–20)", () => {
    const s = resolveStyleStrategy("abstractness", 10);
    expect(s.label).toBe("VERY CONCRETE");
  });

  it("maps low band correctly (21–40)", () => {
    const s = resolveStyleStrategy("abstractness", 30);
    expect(s.label).toBe("CONCRETE");
  });

  it("maps mid band correctly (41–60)", () => {
    const s = resolveStyleStrategy("abstractness", 50);
    expect(s.label).toBe("BALANCED");
  });

  it("maps high band correctly (61–80)", () => {
    const s = resolveStyleStrategy("abstractness", 75);
    expect(s.label).toBe("ABSTRACT");
  });

  it("maps very_high band correctly (81–100)", () => {
    const s = resolveStyleStrategy("abstractness", 95);
    expect(s.label).toBe("VERY ABSTRACT");
  });

  it("all 6 controls resolve without throwing", () => {
    const controls = [
      "abstractness",
      "seriousness",
      "goofiness",
      "depth",
      "poeticness",
      "title_relevance",
    ] as const;

    for (const ctrl of controls) {
      for (let v = 0; v <= 100; v += 25) {
        const s = resolveStyleStrategy(ctrl, v);
        expect(s).toHaveProperty("label");
        expect(s).toHaveProperty("instruction");
        expect(typeof s.instruction).toBe("string");
        expect(s.instruction.length).toBeGreaterThan(10);
      }
    }
  });

  it("returns different strategies for opposite values", () => {
    const low = resolveStyleStrategy("goofiness", 5);
    const high = resolveStyleStrategy("goofiness", 95);
    expect(low.label).not.toBe(high.label);
  });
});
