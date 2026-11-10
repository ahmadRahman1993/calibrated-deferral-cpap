import type { Decision, ReviewCase, ReviewerOutput, RunRecord } from "../types.js";
import { parseReviewerOutput } from "../reviewer/schema.js";
import type { ScoredCase } from "./coverage.js";

/**
 * Guarded policy: auto-approve only if the model's own criteria statuses satisfy:
 * - I1, I2, I3, I4, I7 are all "met"
 * - At least one of I5 or I6 is "met"
 * Otherwise REFER.
 */
function computeGuardedDecision(parsed: ReviewerOutput): Decision {
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

export const CONSISTENCY_K = 5;
export const CONSISTENCY_TEMPERATURE = 0.7;

/** Majority decision. A tie is REFER. Confidence is the share of the k draws that match, so a failed parse does not count as agreement. */
export function consistencyDecision(
  draws: Array<Decision | null>,
  k = draws.length,
): { decision: Decision | null; confidence: number | null } {
  if (k <= 0) return { decision: null, confidence: null };
  const approve = draws.filter((draw) => draw === "APPROVE").length;
  const refer = draws.filter((draw) => draw === "REFER").length;
  if (approve + refer === 0) return { decision: null, confidence: null };
  const decision: Decision = approve > refer ? "APPROVE" : "REFER";
  const agree = decision === "APPROVE" ? approve : refer;
  return { decision, confidence: agree / k };
}

export interface ConsistencyScore {
  scored: ScoredCase[];
  texts: Map<string, string>;
  failedDraws: number;
  draws: number;
}

/** One scored case per review, plus JSON whose confidence is the agreement share, for the reliability metrics. */
export function scoreConsistency(cases: ReviewCase[], records: RunRecord[]): ConsistencyScore {
  const byCase = new Map<string, Map<number, RunRecord>>();
  for (const record of records) {
    if (record.sample == null) continue;
    const slots = byCase.get(record.caseId) ?? new Map<number, RunRecord>();
    slots.set(record.sample, record);
    byCase.set(record.caseId, slots);
  }

  let failedDraws = 0;
  let draws = 0;
  const texts = new Map<string, string>();
  const scored = cases.map((item) => {
    const slots = byCase.get(item.caseId) ?? new Map<number, RunRecord>();
    const parsed = [];
    for (let index = 0; index < CONSISTENCY_K; index++) {
      draws += 1;
      const record = slots.get(index);
      const value = record ? parseReviewerOutput(record.text) : { ok: false as const };
      if (!value.ok) {
        failedDraws += 1;
        parsed.push(null);
        continue;
      }
      parsed.push(value.value);
    }
    const outcome = consistencyDecision(
      parsed.map((value) => value?.decision ?? null),
      CONSISTENCY_K,
    );
    const donor = parsed.find((value) => value?.decision === outcome.decision);
    texts.set(
      item.caseId,
      donor && outcome.confidence != null ? JSON.stringify({ ...donor, confidence: outcome.confidence }) : "",
    );
    return {
      caseId: item.caseId,
      slice: item.slice,
      hardCase: item.hardCase,
      label: item.truth.label,
      decision: outcome.decision,
      confidence: outcome.confidence,
      guardedDecision: donor ? computeGuardedDecision(donor) : null,
    };
  });

  return { scored, texts, failedDraws, draws };
}
