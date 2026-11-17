import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileRadar } from "@/components/ProfileRadar";

describe("ProfileRadar server rendering", () => {
  it("renders each SVG title as one text value and keeps missing dimensions unfilled", () => {
    const html = renderToStaticMarkup(
      <ProfileRadar
        title="核心人格"
        data={[
          { name: "探索欲", english: "curiosity", value: 78 },
          { name: "社交性", english: "social", value: 0 },
          { name: "独立性", english: "independence", value: null },
        ]}
      />,
    );

    expect(html).toContain("<title>探索欲 78 / 100</title>");
    expect(html).toContain("<title>社交性 0 / 100</title>");
    expect(html.match(/<circle\b/g)).toHaveLength(2);
    expect(html).toMatch(/<path\b[^>]*fill="none"/);
    expect(html).not.toContain("NaN");
  });

  it("closes and fills a complete data polygon", () => {
    const html = renderToStaticMarkup(
      <ProfileRadar
        title="核心人格"
        color="#797153"
        data={[
          { name: "探索欲", english: "curiosity", value: 78 },
          { name: "社交性", english: "social", value: 0 },
          { name: "独立性", english: "independence", value: 100 },
        ]}
      />,
    );

    expect(html).toMatch(/<path\b[^>]*d="[^"]+Z"[^>]*fill="#797153"/);
    expect(html.match(/<circle\b/g)).toHaveLength(3);
  });

  it("keeps SVG coordinates stable across small trigonometric differences between engines", () => {
    const chart = <ProfileRadar title="核心人格" data={[
      { name: "探索欲", english: "curiosity", value: 78 },
      { name: "社交性", english: "social", value: 0 },
      { name: "独立性", english: "independence", value: 100 },
    ]} />;
    const original = renderToStaticMarkup(chart);
    const sin = Math.sin;
    const cos = Math.cos;
    const sinSpy = vi.spyOn(Math, "sin").mockImplementation((angle) => sin(angle) + 1e-15);
    const cosSpy = vi.spyOn(Math, "cos").mockImplementation((angle) => cos(angle) - 1e-15);

    try {
      expect(renderToStaticMarkup(chart)).toBe(original);
    } finally {
      sinSpy.mockRestore();
      cosSpy.mockRestore();
    }
  });
});
