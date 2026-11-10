import { validInitialFacts } from "../fixtures/validCase.js";
import type { CaseFacts, Decision, HardCaseTag, Slice, SleepTestType } from "../types.js";

export interface CasePlan {
  slice: Slice;
  hardCase: HardCaseTag[];
  expect: Decision;
  apply: (facts: CaseFacts, n: number) => void;
}

const TEST_TYPES: SleepTestType[] = ["PSG_ATTENDED", "HST_TYPE_II", "HST_TYPE_III", "HST_TYPE_IV"];
const SEXES = ["F", "M", "X"] as const;
const GAP_VALUES = [14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.15, 14.25, 14.35, 14.45, 14.55, 14.65];

export function casePlans(): CasePlan[] {
  const plans: CasePlan[] = [];

  for (let n = 0; n < 120; n++) {
    plans.push({
      slice: "clean_approve",
      hardCase: ["NONE"],
      expect: "APPROVE",
      apply(facts, index) {
        varyDemographics(facts, index);
        setTestType(facts, index);
        if (index < 30) {
          facts.sleepTest.ahi = 6 + (index % 8);
          facts.symptoms = [{ name: "EDS", strength: "explicit", text: "Excessive daytime sleepiness. Epworth Sleepiness Scale score 14. Falls asleep while driving." }];
        } else {
          facts.sleepTest.ahi = 16 + (index % 25);
        }
      },
    });
    void n;
  }

  for (let n = 0; n < 30; n++) {
    plans.push({
      slice: "clean_refer",
      hardCase: ["NONE"],
      expect: "REFER",
      apply(facts, index) {
        varyDemographics(facts, index);
        facts.sleepTest.ahi = 1 + (index % 4);
      },
    });
    void n;
  }

  for (let n = 0; n < 15; n++) {
    plans.push({
      slice: "clean_refer",
      hardCase: ["WRONG_TEST"],
      expect: "REFER",
      apply(facts) {
        facts.sleepTest.type = "OXIMETRY_ONLY";
        facts.sleepTest.ahi = 22;
      },
    });
    void n;
  }

  for (let n = 0; n < 15; n++) {
    plans.push({
      slice: "clean_refer",
      hardCase: ["WRONG_TEST"],
      expect: "REFER",
      apply(facts) {
        facts.sleepTest.type = "HST_TYPE_IV";
        facts.sleepTest.channels = 2;
        facts.sleepTest.ahi = 22;
      },
    });
    void n;
  }

  for (let n = 0; n < 8; n++) {
    plans.push({
      slice: "borderline",
      hardCase: ["BORDERLINE_AHI"],
      expect: "REFER",
      apply(facts, index) {
        facts.sleepTest.ahi = index % 2 === 0 ? 4.8 : 4.9;
      },
    });
    void n;
  }

  for (let n = 0; n < 7; n++) {
    plans.push({
      slice: "borderline",
      hardCase: ["BORDERLINE_AHI"],
      expect: "APPROVE",
      apply(facts) {
        facts.sleepTest.ahi = 5;
        facts.symptoms = [{ name: "EDS", strength: "explicit", text: "Excessive daytime sleepiness. Epworth Sleepiness Scale score 14. Falls asleep while driving." }];
      },
    });
    void n;
  }

  for (let n = 0; n < 5; n++) {
    plans.push({
      slice: "borderline",
      hardCase: ["BORDERLINE_AHI"],
      expect: "APPROVE",
      apply(facts) {
        facts.sleepTest.ahi = 14;
        facts.symptoms = [{ name: "INSOMNIA", strength: "explicit", text: "Insomnia is documented, with trouble staying asleep most nights." }];
      },
    });
    void n;
  }

  for (let n = 0; n < 5; n++) {
    plans.push({
      slice: "borderline",
      hardCase: ["BORDERLINE_AHI"],
      expect: "APPROVE",
      apply(facts) {
        facts.sleepTest.ahi = 15;
      },
    });
    void n;
  }

  for (let n = 0; n < 5; n++) {
    plans.push({
      slice: "borderline",
      hardCase: ["BORDERLINE_AHI", "SCORING_RULE"],
      expect: "REFER",
      apply(facts) {
        facts.sleepTest.ahi = 15.2;
        facts.sleepTest.hypopneaRule = "3pct";
      },
    });
    void n;
  }

  for (let n = 0; n < GAP_VALUES.length; n++) {
    const ahi = GAP_VALUES[n]!;
    plans.push({
      slice: "borderline",
      hardCase: ["POLICY_GAP", "BORDERLINE_AHI"],
      expect: "REFER",
      apply(facts) {
        facts.sleepTest.ahi = ahi;
        facts.symptoms = [{ name: "EDS", strength: "explicit", text: "Excessive daytime sleepiness. Epworth Sleepiness Scale score 14. Falls asleep while driving." }];
      },
    });
    void n;
  }

  for (let n = 0; n < 8; n++) {
    plans.push({
      slice: "borderline",
      hardCase: ["SHORT_SLEEP"],
      expect: "REFER",
      apply(facts) {
        facts.sleepTest.ahi = 22;
        facts.sleepTest.recordedSleepMin = 90;
        facts.sleepTest.totalEvents = 29;
      },
    });
    void n;
  }

  for (let n = 0; n < 4; n++) {
    plans.push({
      slice: "borderline",
      hardCase: ["SHORT_SLEEP"],
      expect: "APPROVE",
      apply(facts) {
        facts.sleepTest.ahi = 22;
        facts.sleepTest.recordedSleepMin = 90;
        facts.sleepTest.totalEvents = 30;
      },
    });
    void n;
  }

  for (let n = 0; n < 3; n++) {
    plans.push({
      slice: "borderline",
      hardCase: ["SHORT_SLEEP"],
      expect: "REFER",
      apply(facts) {
        facts.sleepTest.ahi = 9;
        facts.sleepTest.recordedSleepMin = 90;
        facts.sleepTest.totalEvents = 9;
        facts.symptoms = [{ name: "EDS", strength: "explicit", text: "Excessive daytime sleepiness. Epworth Sleepiness Scale score 14. Falls asleep while driving." }];
      },
    });
    void n;
  }

  for (let n = 0; n < 15; n++) {
    plans.push({
      slice: "missing",
      hardCase: ["MISSING_DATA"],
      expect: "REFER",
      apply(facts) {
        facts.patient.age = null;
      },
    });
    void n;
  }

  for (let n = 0; n < 15; n++) {
    plans.push({
      slice: "missing",
      hardCase: ["MISSING_DATA"],
      expect: "REFER",
      apply(facts) {
        facts.clinicalEval.date = null;
      },
    });
    void n;
  }

  for (let n = 0; n < 15; n++) {
    plans.push({
      slice: "missing",
      hardCase: ["MISSING_DATA"],
      expect: "REFER",
      apply(facts) {
        facts.sleepTest.type = null;
      },
    });
    void n;
  }

  for (let n = 0; n < 15; n++) {
    plans.push({
      slice: "missing",
      hardCase: ["MISSING_DATA"],
      expect: "REFER",
      apply(facts) {
        facts.sleepTest.ahi = null;
        facts.sleepTest.rdi = null;
      },
    });
    void n;
  }

  for (let n = 0; n < 30; n++) {
    plans.push({
      slice: "conflict",
      hardCase: ["CONFLICT"],
      expect: "REFER",
      apply(facts) {
        facts.sleepTest.ahi = 18;
        facts.conflicts = [{ field: "sleepTest.ahi", values: ["18", "8"], docs: ["D3", "D2"] }];
      },
    });
    void n;
  }

  for (let n = 0; n < 30; n++) {
    plans.push({
      slice: "conflict",
      hardCase: ["CONFLICT"],
      expect: "REFER",
      apply(facts) {
        facts.conflicts = [{ field: "clinicalEval.date", values: ["2024-03-01", "2024-04-15"], docs: ["D2", "D1"] }];
      },
    });
    void n;
  }

  for (let n = 0; n < 40; n++) {
    plans.push({
      slice: "ambiguous",
      hardCase: ["AMBIGUOUS_SYMPTOM"],
      expect: "REFER",
      apply(facts, index) {
        facts.sleepTest.ahi = 6 + (index % 8);
        facts.symptoms = [{ name: "EDS", strength: "vague", text: "Feels a bit tired lately." }];
      },
    });
    void n;
  }

  if (plans.length !== 400) {
    throw new Error(`Expected 400 case plans, got ${plans.length}`);
  }
  return plans;
}

function varyDemographics(facts: CaseFacts, index: number): void {
  facts.patient.age = 19 + (index % 50);
  facts.patient.sex = SEXES[index % SEXES.length]!;
}

function setTestType(facts: CaseFacts, index: number): void {
  const type = TEST_TYPES[index % TEST_TYPES.length]!;
  facts.sleepTest.type = type;
  facts.sleepTest.channels = type === "HST_TYPE_IV" ? 4 : null;
}

export function materializeFacts(seed: number): CaseFacts[] {
  const plans = casePlans();
  const seen = new Map<Slice, number>();
  return plans.map((plan, index) => {
    const withinSlice = seen.get(plan.slice) ?? 0;
    seen.set(plan.slice, withinSlice + 1);
    const caseId = caseIdFor(index);
    const facts = validInitialFacts(caseId, seed + index);
    plan.apply(facts, withinSlice);
    facts.caseId = caseId;
    facts.seed = seed + index;
    facts.hardCase = plan.hardCase;
    facts.requestType = "initial";
    return facts;
  });
}

export function caseIdFor(index: number): string {
  return `case-${String(index + 1).padStart(4, "0")}`;
}
