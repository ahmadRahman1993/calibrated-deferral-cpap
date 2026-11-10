import { describe, expect, it } from "vitest";
import { consistencyDecision } from "./consistency.js";

describe("consistency confidence", () => {
  it("uses the majority and keeps failed draws in the denominator", () => {
    expect(consistencyDecision(["APPROVE", "APPROVE", "APPROVE", "REFER", null], 5)).toEqual({
      decision: "APPROVE",
      confidence: 0.6,
    });
  });

  it("refers a tie", () => {
    expect(consistencyDecision(["APPROVE", "APPROVE", "REFER", "REFER", null], 5)).toEqual({
      decision: "REFER",
      confidence: 0.4,
    });
  });

  it("returns no decision when every draw failed", () => {
    expect(consistencyDecision([null, null, null, null, null], 5)).toEqual({
      decision: null,
      confidence: null,
    });
  });
});
