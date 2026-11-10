import { describe, expect, it } from "vitest";
import type { ScoredCase } from "./coverage.js";
import { safeThreshold } from "./coverage.js";
import { headlineChart } from "./charts.js";
import { quoteInLine } from "./citations.js";
import { wilsonUpper } from "./wilson.js";

describe("coverage and citations", () => {
  it("picks the lowest threshold whose Wilson bound stays under 5%", () => {
    const cases: ScoredCase[] = [
      ...Array.from({ length: 100 }, (_, index) => scored(`high-${index}`, "APPROVE", "APPROVE", 0.95)),
      ...Array.from({ length: 100 }, (_, index) => scored(`low-ok-${index}`, "APPROVE", "APPROVE", 0.6)),
      ...Array.from({ length: 10 }, (_, index) => scored(`low-bad-${index}`, "REFER", "APPROVE", 0.6)),
      scored("miss", "REFER", null, null),
    ];
    const chosen = safeThreshold(cases, 0.05);
    expect(chosen).not.toBeNull();
    expect(chosen!.t).toBe(0.61);
    expect(chosen!.wilsonUpper!).toBeLessThanOrEqual(0.05);
    expect(chosen!.errors).toBe(0);
    expect(chosen!.n).toBe(100);
  });

  it("treats zero observed errors in a small set as still above a 5% bound", () => {
    const cases = Array.from({ length: 5 }, (_, index) => scored(`ok-${index}`, "APPROVE", "APPROVE", 0.99));
    expect(wilsonUpper(0, 5)!).toBeGreaterThan(0.05);
    expect(safeThreshold(cases, 0.05)).toBeNull();
  });

  it("matches a quote after whitespace is collapsed and rejects a paraphrase", () => {
    expect(quoteInLine("AHI:  22 events/hour.", "AHI: 22 events/hour.")).toBe(true);
    expect(quoteInLine("AHI was twenty two", "AHI: 22 events/hour.")).toBe(false);
    expect(quoteInLine("   ", "AHI: 22 events/hour.")).toBe(false);
  });

  it("draws the safe-threshold sentence into the headline chart", () => {
    const cases = Array.from({ length: 100 }, (_, index) => scored(`c-${index}`, "APPROVE", "APPROVE", 0.99));
    const marker = safeThreshold(cases, 0.05);
    const svg = headlineChart(
      [
        {
          name: "Consistency confidence",
          color: "#1c1917",
          band: "#b45309",
          points: [{ t: 0.99, n: 100, errors: 0, coverage: 1, errorRate: 0, wilsonUpper: marker!.wilsonUpper }],
          marker,
        },
      ],
      0.05,
    );
    expect(svg).toContain("What share of cases can be safely auto-approved");
    expect(svg).toContain("auto-approved");
    expect(svg).toContain("error bound");
  });
});

function scored(
  caseId: string,
  label: "APPROVE" | "REFER",
  decision: "APPROVE" | "REFER" | null,
  confidence: number | null,
): ScoredCase {
  return { caseId, slice: "clean_approve", hardCase: ["NONE"], label, decision, confidence };
}
