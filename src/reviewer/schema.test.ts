import { describe, expect, it } from "vitest";
import { jsonElicitor } from "./elicitor.js";
import { parseReviewerOutput, sampleOutput } from "./schema.js";

describe("reviewer schema", () => {
  it("accepts a refer decision and an approve decision that quotes every criterion", () => {
    expect(parseReviewerOutput(JSON.stringify(sampleOutput("REFER"))).ok).toBe(true);
    expect(parseReviewerOutput(JSON.stringify(sampleOutput("APPROVE"))).ok).toBe(true);
  });

  it("strips one json fence and rejects prose around the object", () => {
    const fenced = "```json\n" + JSON.stringify(sampleOutput("REFER")) + "\n```";
    expect(parseReviewerOutput(fenced).ok).toBe(true);
    expect(parseReviewerOutput(`Here you go:\n${JSON.stringify(sampleOutput("REFER"))}`).ok).toBe(false);
  });

  it("keeps an approve whose statuses disagree with the decision, and rejects a bad confidence or any other decision", () => {
    const thin = sampleOutput("APPROVE");
    thin.criteria[0]!.status = "unclear";
    thin.criteria[0]!.evidence = [];
    expect(parseReviewerOutput(JSON.stringify(thin)).ok).toBe(true);
    const sure = sampleOutput("REFER");
    sure.confidence = 1.2;
    expect(parseReviewerOutput(JSON.stringify(sure)).ok).toBe(false);
    const other = sampleOutput("REFER") as unknown as { decision: string };
    other.decision = ["DE", "NY"].join("");
    expect(parseReviewerOutput(JSON.stringify(other)).ok).toBe(false);
  });

  it("accepts an approve when only one severity tier is met and rejects not_applicable", () => {
    const tierB = sampleOutput("APPROVE");
    const severity = tierB.criteria.find((item) => item.id === "I5");
    if (!severity) throw new Error("missing I5");
    severity.status = "not_met";
    severity.evidence = [];
    expect(parseReviewerOutput(JSON.stringify(tierB)).ok).toBe(true);
    const extra = { ...sampleOutput("REFER"), conflicts: ["AHI"] };
    expect(parseReviewerOutput(JSON.stringify(extra)).ok).toBe(true);
    const wrong = sampleOutput("REFER");
    const sixth = wrong.criteria.find((item) => item.id === "I6");
    if (!sixth) throw new Error("missing I6");
    sixth.status = "not_applicable" as typeof sixth.status;
    expect(parseReviewerOutput(JSON.stringify(wrong)).ok).toBe(false);
  });

  it("scores a bad parse as an empty answer with no confidence", () => {
    expect(jsonElicitor.parse("nope")).toEqual({ answer: "", confidence: null });
    const parsed = jsonElicitor.parse(JSON.stringify(sampleOutput("APPROVE")));
    expect(parsed).toEqual({ answer: "APPROVE", confidence: 0.9 });
    expect(jsonElicitor.buildPrompt("keep")).toBe("keep");
  });
});
