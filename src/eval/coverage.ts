import type { Decision, ReviewCase, RunRecord, Slice } from "../types.js";
import { parseReviewerOutput } from "../reviewer/schema.js";
import { wilsonUpper } from "./wilson.js";

export interface ScoredCase {
  caseId: string;
  slice: Slice;
  hardCase: string[];
  label: Decision;
  decision: Decision | null;
  confidence: number | null;
}

export function scoreCase(review: ReviewCase, record: RunRecord | undefined): ScoredCase {
  const base = {
    caseId: review.caseId,
    slice: review.slice,
    hardCase: review.hardCase,
    label: review.truth.label,
  };
  if (!record) return { ...base, decision: null, confidence: null };
  const parsed = parseReviewerOutput(record.text);
  if (!parsed.ok) return { ...base, decision: null, confidence: null };
  return {
    ...base,
    decision: parsed.value.decision,
    confidence: parsed.value.confidence,
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
