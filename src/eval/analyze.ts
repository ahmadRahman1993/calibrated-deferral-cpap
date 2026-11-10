import type { ReviewCase, RunRecord } from "../types.js";
import { citationStats } from "./citations.js";
import { coverageCurve, safeThreshold, scoreCase, type CurvePoint, type ScoredCase } from "./coverage.js";
import { sliceTable, tagTable, type GroupMetrics } from "./slices.js";

export interface VariantAnalysis {
  variant: "A" | "B";
  model: string | null;
  n: number;
  parseFailures: number;
  parseFailureRate: number;
  citations: { valid: number; total: number; rate: number | null };
  slices: GroupMetrics[];
  tags: GroupMetrics[];
  curve: CurvePoint[];
  safeAt5: CurvePoint | null;
  safeAt2: CurvePoint | null;
  scored: ScoredCase[];
}

export function analyzeVariant(variant: "A" | "B", cases: ReviewCase[], records: RunRecord[]): VariantAnalysis {
  const byId = new Map(records.map((record) => [record.caseId, record]));
  const scored = cases.map((item) => scoreCase(item, byId.get(item.caseId)));
  const parseFailures = scored.filter((item) => item.decision == null || item.confidence == null).length;
  return finish(variant, records[0]?.model ?? null, scored, citationStats(cases, records), parseFailures);
}

export function analyzeScored(
  variant: "A" | "B",
  model: string | null,
  scored: ScoredCase[],
  citations: VariantAnalysis["citations"],
): VariantAnalysis {
  const parseFailures = scored.filter((item) => item.decision == null || item.confidence == null).length;
  return finish(variant, model, scored, citations, parseFailures);
}

function finish(
  variant: "A" | "B",
  model: string | null,
  scored: ScoredCase[],
  citations: VariantAnalysis["citations"],
  parseFailures: number,
): VariantAnalysis {
  return {
    variant,
    model,
    n: scored.length,
    parseFailures,
    parseFailureRate: scored.length === 0 ? 0 : parseFailures / scored.length,
    citations,
    slices: sliceTable(scored),
    tags: tagTable(scored),
    curve: coverageCurve(scored),
    safeAt5: safeThreshold(scored, 0.05),
    safeAt2: safeThreshold(scored, 0.02),
    scored,
  };
}
