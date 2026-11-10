import { describe, expect, it } from "vitest";
import { decide } from "../../policy/rules.js";
import { POLICY_VERSION } from "../../policy/criteria.js";
import { readJsonl } from "../jsonl.js";
import type { HardCaseTag, ReviewCase } from "../types.js";
import { buildPrompt, promptIncludesGroundTruth } from "../reviewer/prompt.js";
import { casePlans } from "./facts.js";
import { casesPath, generateDataset } from "./generate.js";
import { selectReviewCases } from "./reviewPacket.js";

describe("synthetic cases", () => {
  const cases = generateDataset(42);
  const plans = casePlans();

  it("builds 400 reproducible initial cases with the planned mix", () => {
    expect(cases).toHaveLength(400);
    expect(cases.map((item) => item.truth.label)).toEqual(plans.map((plan) => plan.expect));
    expect(generateDataset(42)).toEqual(cases);
    expect(readJsonl<ReviewCase>(casesPath())).toEqual(cases);
    expect(count(cases, "clean_approve")).toBe(120);
    expect(count(cases, "clean_refer")).toBe(60);
    expect(count(cases, "borderline")).toBe(60);
    expect(count(cases, "missing")).toBe(60);
    expect(count(cases, "conflict")).toBe(60);
    expect(count(cases, "ambiguous")).toBe(40);
  });

  it("stores the same label the rules engine returns from the facts", () => {
    for (const item of cases) {
      expect(decide(item.facts)).toEqual(item.truth);
      expect(item.truth.policyVersion).toBe(POLICY_VERSION);
      expect(item.requestType).toBe("initial");
      if (item.truth.label === "APPROVE") expect(item.truth.reasons).toEqual([]);
    }
    expect(tagged(cases, "POLICY_GAP").length).toBeGreaterThan(0);
    expect(tagged(cases, "POLICY_GAP").every((reasons) => reasons.includes("POLICY_GAP"))).toBe(true);
    expect(tagged(cases, "SCORING_RULE").every((reasons) => reasons.includes("SCORING_RULE"))).toBe(true);
    expect(tagged(cases, "CONFLICT").every((reasons) => reasons.includes("CONFLICT"))).toBe(true);
    expect(tagged(cases, "AMBIGUOUS_SYMPTOM").every((reasons) => reasons.includes("I6:AMBIGUOUS_SYMPTOM"))).toBe(true);
    expect(tagged(cases, "WRONG_TEST").every((reasons) => reasons.includes("I3"))).toBe(true);
    expect(tagged(cases, "MISSING_DATA").every((reasons) => reasons.length > 0)).toBe(true);
  });

  it("shows conflicting values and omits a missing age", () => {
    const conflict = cases.find((item) => item.facts.conflicts.some((entry) => entry.field === "sleepTest.ahi"));
    expect(conflict).toBeDefined();
    const text = conflict!.documents.flatMap((document) => document.lines).join("\n");
    expect(text).toContain("AHI: 18 events/hour.");
    expect(text).toContain("AHI 8 events/hour.");

    const missingAge = cases.find((item) => item.slice === "missing" && item.facts.patient.age == null);
    expect(missingAge).toBeDefined();
    const referral = missingAge!.documents[0]?.lines.join("\n") ?? "";
    expect(referral).toContain("Patient age is not documented.");
    expect(referral).not.toContain("Patient age:");
  });

  it("keeps the ground-truth object out of the reviewer prompt", () => {
    const prompt = buildPrompt(cases[0]!, "A");
    expect(promptIncludesGroundTruth(prompt)).toBe(false);
    expect(prompt).toContain("You never deny.");
    expect(prompt).not.toContain("List anything conflicting");
    expect(buildPrompt(cases[0]!, "B")).toContain("List anything conflicting across documents before you decide.");
  });

  it("picks five cases from each slice for the hand review", () => {
    const picked = selectReviewCases(cases);
    expect(picked).toHaveLength(30);
    const slices = new Set(picked.map((item) => item.slice));
    expect(slices.size).toBe(6);
  });
});

function count(cases: ReturnType<typeof generateDataset>, slice: string): number {
  return cases.filter((item) => item.slice === slice).length;
}

function tagged(cases: ReviewCase[], tag: HardCaseTag): string[][] {
  return cases.filter((item) => item.hardCase.includes(tag)).map((item) => item.truth.reasons);
}
