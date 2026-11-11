import { POLICY_VERSION } from "./criteria.js";
import type { CaseFacts, Decision, GroundTruth, RuleId, RuleStatus } from "../src/types.js";

/**
 * Ground truth for an initial CPAP request.
 *
 * Severity is the OR of I5 and I6. A met tier A leaves I6 as not_met, and the
 * reverse, without blocking approval. APPROVE also requires I1, I2, I3, I4,
 * and I7 to be met, an empty conflict list, and no SCORING_RULE flag.
 *
 * Continuation requests are rejected here. They are specified and not implemented.
 */
export interface RulesConfig {
  strictIndex?: boolean;
  minEvents?: "ncd" | "lcd";
}

export function decide(facts: CaseFacts, config: RulesConfig = {}): GroundTruth {
  if (facts.requestType !== "initial") {
    throw new Error(`Continuation rules are out of scope for v1 (${facts.caseId}).`);
  }

  const minEvents = config.minEvents ?? "lcd";
  const indexes = consideredIndexes(facts, config.strictIndex === true);
  const i1 = evalI1(facts);
  const i2 = evalI2(facts);
  const i3 = evalI3(facts);
  const i4 = evalI4(facts);
  const i5 = evalI5(indexes);
  const i6 = evalI6(facts, indexes);
  const i7 = evalI7(facts, i5.status, i6.status, minEvents);
  const scoring = scoringAmbiguity(facts, indexes, i5.status, i6.status);

  const rules: Record<RuleId, RuleStatus> = {
    I1: i1,
    I2: i2.status,
    I3: i3,
    I4: i4,
    I5: i5.status,
    I6: i6.status,
    I7: i7,
  };

  const reasons: string[] = [];
  if (facts.conflicts.length > 0) reasons.push("CONFLICT");
  if (rules.I1 !== "met") reasons.push("I1");
  if (rules.I2 !== "met") reasons.push(i2.evalMode ? "I2:EVAL_MODE" : "I2");
  if (rules.I3 !== "met") reasons.push("I3");
  if (rules.I4 !== "met") reasons.push("I4");
  reasons.push(...severityReasons(indexes, i5.status, i6));
  if (rules.I7 !== "met") reasons.push("I7");
  if (scoring) reasons.push("SCORING_RULE");

  const severityMet = rules.I5 === "met" || rules.I6 === "met";
  const gatesMet = (["I1", "I2", "I3", "I4", "I7"] as const).every((id) => rules[id] === "met");
  const label: Decision =
    gatesMet && severityMet && facts.conflicts.length === 0 && !scoring ? "APPROVE" : "REFER";

  return {
    caseId: facts.caseId,
    label,
    rules,
    reasons,
    policyVersion: POLICY_VERSION,
  };
}

export function consideredIndexes(facts: CaseFacts, strictIndex: boolean): number[] {
  const { ahi, rdi } = facts.sleepTest;
  if (strictIndex) return ahi == null ? [] : [ahi];
  return [ahi, rdi].filter((value): value is number => value != null);
}

function evalI1(facts: CaseFacts): RuleStatus {
  if (facts.patient.age == null) return "unclear";
  return facts.patient.age >= 18 ? "met" : "not_met";
}

function evalI2(facts: CaseFacts): { status: RuleStatus; evalMode: boolean } {
  const evaluation = facts.clinicalEval;
  if (!evaluation.present) return { status: "not_met", evalMode: false };
  if (evaluation.mode === "telehealth") return { status: "not_met", evalMode: true };
  if (evaluation.mode == null) return { status: "unclear", evalMode: false };
  if (evaluation.date == null || facts.sleepTest.date == null) return { status: "unclear", evalMode: false };
  if (evaluation.date > facts.sleepTest.date) return { status: "not_met", evalMode: false };
  if (evaluation.date === facts.sleepTest.date) return { status: "unclear", evalMode: false };
  if (evaluation.byTreating === false) return { status: "not_met", evalMode: false };
  if (evaluation.byTreating == null) return { status: "unclear", evalMode: false };
  return { status: "met", evalMode: false };
}

function evalI3(facts: CaseFacts): RuleStatus {
  const test = facts.sleepTest;
  if (!test.present) return "not_met";
  if (test.type == null) return "unclear";
  if (test.type === "PSG_ATTENDED" || test.type === "HST_TYPE_II" || test.type === "HST_TYPE_III") {
    return "met";
  }
  if (test.type === "OXIMETRY_ONLY") return "not_met";
  if (test.channels == null) return "unclear";
  return test.channels >= 3 ? "met" : "not_met";
}

function evalI4(facts: CaseFacts): RuleStatus {
  if (!facts.sleepTest.present) return "not_met";
  if (facts.sleepTest.orderedByTreating === true) return "met";
  if (facts.sleepTest.orderedByTreating === false) return "not_met";
  return "unclear";
}

function evalI5(indexes: number[]): { status: RuleStatus } {
  if (indexes.length === 0) return { status: "unclear" };
  return { status: indexes.some((value) => value >= 15) ? "met" : "not_met" };
}

function evalI6(facts: CaseFacts, indexes: number[]): { status: RuleStatus; ambiguous: boolean } {
  if (indexes.length === 0) return { status: "unclear", ambiguous: false };
  const inTierB = indexes.some((value) => value >= 5 && value <= 14);
  if (!inTierB) return { status: "not_met", ambiguous: false };
  if (hasExplicitSymptom(facts) || hasDocumentedComorbidity(facts)) {
    return { status: "met", ambiguous: false };
  }
  if (hasVagueSymptom(facts)) return { status: "unclear", ambiguous: true };
  return { status: "not_met", ambiguous: false };
}

function evalI7(
  facts: CaseFacts,
  i5: RuleStatus,
  i6: RuleStatus,
  minEvents: "ncd" | "lcd",
): RuleStatus {
  const sleep = facts.sleepTest.recordedSleepMin;
  const events = facts.sleepTest.totalEvents;
  const severityMet = i5 === "met" || i6 === "met";
  const shortSleep = sleep != null && sleep < 120;
  const floorApplies = minEvents === "lcd" ? true : shortSleep;

  if (sleep == null && minEvents === "ncd") return "unclear";
  if (!floorApplies) return "met";
  if (!severityMet) return "met";
  if (events == null) return "unclear";
  const floor = i5 === "met" ? 30 : 10;
  return events >= floor ? "met" : "not_met";
}

function scoringAmbiguity(
  facts: CaseFacts,
  indexes: number[],
  i5: RuleStatus,
  i6: RuleStatus,
): boolean {
  // Any 3% desaturation rule -> REFER. Medicare uses the 4% rule.
  return facts.sleepTest.hypopneaRule === "3pct";
}

function severityReasons(
  indexes: number[],
  i5: RuleStatus,
  i6: { status: RuleStatus; ambiguous: boolean },
): string[] {
  if (i5 === "met" || i6.status === "met") return [];
  if (i6.ambiguous) return ["I6:AMBIGUOUS_SYMPTOM"];
  if (indexes.some((value) => value > 14 && value < 15)) return ["POLICY_GAP"];
  if (i5 === "unclear" || i6.status === "unclear") return ["I5", "I6"];
  if (indexes.some((value) => value >= 5 && value <= 14)) return ["I6"];
  return ["I5", "I6"];
}

function hasExplicitSymptom(facts: CaseFacts): boolean {
  return facts.symptoms.some((symptom) => symptom.strength === "explicit");
}

function hasVagueSymptom(facts: CaseFacts): boolean {
  return facts.symptoms.some((symptom) => symptom.strength === "vague");
}

function hasDocumentedComorbidity(facts: CaseFacts): boolean {
  return facts.comorbidities.some((item) => item.documented);
}
