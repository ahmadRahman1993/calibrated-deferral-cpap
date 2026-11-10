import type { Decision, ReviewCase, ReviewerOutput, RunRecord, Slice } from "../types.js";
import { parseReviewerOutput } from "../reviewer/schema.js";
import { wilsonUpper } from "./wilson.js";

export interface ScoredCase {
  caseId: string;
  slice: Slice;
  hardCase: string[];
  label: Decision;
  decision: Decision | null;
  confidence: number | null;
  guardedDecision?: Decision | null;
}

/**
 * Guarded policy: filter on APPROVE decisions.
 * Final decision is APPROVE only if:
 * 1. Model said APPROVE, AND
 * 2. Model's own criteria statuses satisfy: I1, I2, I3, I4, I7 all "met", and (I5 or I6) "met"
 * Otherwise REFER.
 */
function computeGuardedDecision(parsed: ReviewerOutput): Decision {
  // If model didn't say APPROVE, guard doesn't override
  if (parsed.decision !== "APPROVE") return "REFER";
  
  const statusMap = new Map(parsed.criteria.map((c) => [c.id, c.status]));
  
  // Check gates: I1, I2, I3, I4, I7 must all be "met"
  for (const gate of ["I1", "I2", "I3", "I4", "I7"]) {
    if (statusMap.get(gate) !== "met") return "REFER";
  }
  
  // Check severity: at least one of I5 or I6 must be "met"
  const i5 = statusMap.get("I5");
  const i6 = statusMap.get("I6");
  if (i5 !== "met" && i6 !== "met") return "REFER";
  
  return "APPROVE";
}

export function scoreCase(review: ReviewCase, record: RunRecord | undefined): ScoredCase {
  const base = {
    caseId: review.caseId,
    slice: review.slice,
    hardCase: review.hardCase,
    label: review.truth.label,
  };
  if (!record) return { ...base, decision: null, confidence: null, guardedDecision: null };
  const parsed = parseReviewerOutput(record.text);
  if (!parsed.ok) return { ...base, decision: null, confidence: null, guardedDecision: null };
  return {
    ...base,
    decision: parsed.value.decision,
    confidence: parsed.value.confidence,
    guardedDecision: computeGuardedDecision(parsed.value),
  };
}

export function thresholdGrid(): number[] {
  const values: number[] = [];
  for (let step = 50; step <= 99; step++) values.push(step / 100);
  return values;
}

export interface CurvePoint {
  t: number;
  n: number;
  errors: number;
  coverage: number;
  errorRate: number | null;
  wilsonUpper: number | null;
}

export interface GuardedMetrics {
  accuracy: number;
  approves: number;
  correct: number;
  wrong: number;
}

export function curvePoint(cases: ScoredCase[], t: number): CurvePoint {
  const set = cases.filter(
    (item) => item.decision === "APPROVE" && item.confidence != null && item.confidence >= t,
  );
  const errors = set.filter((item) => item.label === "REFER").length;
  const n = set.length;
  return {
    t,
    n,
    errors,
    coverage: cases.length === 0 ? 0 : n / cases.length,
    errorRate: n === 0 ? null : errors / n,
    wilsonUpper: wilsonUpper(errors, n),
  };
}

export function coverageCurve(cases: ScoredCase[]): CurvePoint[] {
  return thresholdGrid().map((t) => curvePoint(cases, t));
}

/** Lowest threshold whose 95% Wilson upper bound is at or under the target, with a non-empty set. */
export function safeThreshold(cases: ScoredCase[], target: number): CurvePoint | null {
  const passing = coverageCurve(cases).filter(
    (point) => point.n > 0 && point.wilsonUpper != null && point.wilsonUpper <= target,
  );
  if (passing.length === 0) return null;
  return passing.reduce((best, point) => (point.t < best.t ? point : best));
}

export function guardedMetrics(cases: ScoredCase[]): GuardedMetrics {
  const approves = cases.filter((item) => item.guardedDecision === "APPROVE");
  const correct = approves.filter((item) => item.label === "APPROVE");
  return {
    accuracy: cases.length === 0 ? 0 : cases.filter((item) => item.guardedDecision === item.label).length / cases.length,
    approves: approves.length,
    correct: correct.length,
    wrong: approves.length - correct.length,
  };
}
