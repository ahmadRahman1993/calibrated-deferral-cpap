import { describe, expect, it } from "vitest";
import { INITIAL_CRITERIA } from "./criteria.js";
import { decide } from "./rules.js";
import { validInitialFacts } from "../src/fixtures/validCase.js";
import type { CaseFacts } from "../src/types.js";

function facts(mutate: (draft: CaseFacts) => void = () => {}): CaseFacts {
  const draft = validInitialFacts("case-test", 1);
  mutate(draft);
  return draft;
}

function label(mutate: (draft: CaseFacts) => void = () => {}, config?: Parameters<typeof decide>[1]) {
  return decide(facts(mutate), config);
}

describe("initial CPAP rules", () => {
  it("approves a clean adult PSG with AHI 22", () => {
    const result = label();
    expect(result.label).toBe("APPROVE");
    expect(result.reasons).toEqual([]);
    expect(result.rules.I5).toBe("met");
    expect(result.rules.I6).toBe("not_met");
  });

  it("tags every rule id with a source quote", () => {
    const ids = INITIAL_CRITERIA.map((item) => item.id);
    expect(ids).toEqual(["I1", "I2", "I3", "I4", "I5", "I6", "I7"]);
    for (const item of INITIAL_CRITERIA) {
      expect(item.source.length).toBeGreaterThan(0);
      expect(item.quote.length).toBeGreaterThan(0);
    }
  });

  it("treats age 18 as adult and 17 as not met", () => {
    expect(label((draft) => { draft.patient.age = 18; }).label).toBe("APPROVE");
    const child = label((draft) => { draft.patient.age = 17; });
    expect(child.label).toBe("REFER");
    expect(child.reasons).toContain("I1");
    const missing = label((draft) => { draft.patient.age = null; });
    expect(missing.rules.I1).toBe("unclear");
    expect(missing.label).toBe("REFER");
  });

  it("draws the severity boundaries at 4.9, 5, 14, 14.6, and 15", () => {
    const below = label((draft) => { draft.sleepTest.ahi = 4.9; });
    expect(below.label).toBe("REFER");
    expect(below.reasons).toEqual(["I5", "I6"]);

    const tierBWithoutSymptom = label((draft) => { draft.sleepTest.ahi = 5; });
    expect(tierBWithoutSymptom.label).toBe("REFER");
    expect(tierBWithoutSymptom.reasons).toEqual(["I6"]);

    const atFive = label((draft) => {
      draft.sleepTest.ahi = 5;
      draft.symptoms = [{ name: "EDS", strength: "explicit", text: "Epworth 14" }];
    });
    expect(atFive.label).toBe("APPROVE");

    const atFourteen = label((draft) => {
      draft.sleepTest.ahi = 14;
      draft.symptoms = [{ name: "EDS", strength: "explicit", text: "Epworth 14" }];
    });
    expect(atFourteen.label).toBe("APPROVE");

    const gap = label((draft) => { draft.sleepTest.ahi = 14.6; });
    expect(gap.label).toBe("REFER");
    expect(gap.reasons).toEqual(["POLICY_GAP"]);

    expect(label((draft) => { draft.sleepTest.ahi = 15; }).label).toBe("APPROVE");
  });

  it("lets either index qualify, and AHI only when strictIndex is set", () => {
    const either = label((draft) => {
      draft.sleepTest.ahi = 12;
      draft.sleepTest.rdi = 16;
    });
    expect(either.label).toBe("APPROVE");
    expect(either.rules.I5).toBe("met");

    const strict = label(
      (draft) => {
        draft.sleepTest.ahi = 12;
        draft.sleepTest.rdi = 16;
      },
      { strictIndex: true },
    );
    expect(strict.label).toBe("REFER");
    expect(strict.reasons).toEqual(["I6"]);
  });

  it("applies the event floor only under 2 hours unless the LCD option is on", () => {
    const shortFail = label((draft) => {
      draft.sleepTest.recordedSleepMin = 90;
      draft.sleepTest.totalEvents = 29;
    });
    expect(shortFail.label).toBe("REFER");
    expect(shortFail.reasons).toEqual(["I7"]);

    expect(label((draft) => {
      draft.sleepTest.recordedSleepMin = 90;
      draft.sleepTest.totalEvents = 30;
    }).label).toBe("APPROVE");

    const tierBShort = label((draft) => {
      draft.sleepTest.ahi = 9;
      draft.sleepTest.recordedSleepMin = 90;
      draft.sleepTest.totalEvents = 9;
      draft.symptoms = [{ name: "EDS", strength: "explicit", text: "Epworth 14" }];
    });
    expect(tierBShort.reasons).toEqual(["I7"]);

    expect(label((draft) => {
      draft.sleepTest.ahi = 9;
      draft.sleepTest.recordedSleepMin = 90;
      draft.sleepTest.totalEvents = 10;
      draft.symptoms = [{ name: "EDS", strength: "explicit", text: "Epworth 14" }];
    }).label).toBe("APPROVE");

    expect(label((draft) => {
      draft.sleepTest.recordedSleepMin = 90;
      draft.sleepTest.totalEvents = 10;
    }).reasons).toEqual(["I7"]);

    const longAndFewNcd = label((draft) => { draft.sleepTest.totalEvents = 20; }, { minEvents: "ncd" });
    expect(longAndFewNcd.label).toBe("APPROVE");

    const longAndFewLcd = label((draft) => { draft.sleepTest.totalEvents = 20; });
    expect(longAndFewLcd.label).toBe("REFER");
    expect(longAndFewLcd.reasons).toEqual(["I7"]);
  });

  it("refers telehealth, a late evaluation, a weak test, and a test nobody ordered", () => {
    const telehealth = label((draft) => { draft.clinicalEval.mode = "telehealth"; });
    expect(telehealth.label).toBe("REFER");
    expect(telehealth.reasons).toEqual(["I2:EVAL_MODE"]);

    const late = label((draft) => { draft.clinicalEval.date = "2024-04-01"; });
    expect(late.reasons).toEqual(["I2"]);

    const sameDay = label((draft) => { draft.clinicalEval.date = "2024-03-20"; });
    expect(sameDay.rules.I2).toBe("unclear");

    expect(label((draft) => {
      draft.sleepTest.type = "HST_TYPE_IV";
      draft.sleepTest.channels = 2;
    }).reasons).toEqual(["I3"]);

    expect(label((draft) => {
      draft.sleepTest.type = "HST_TYPE_IV";
      draft.sleepTest.channels = 3;
    }).label).toBe("APPROVE");

    expect(label((draft) => { draft.sleepTest.type = "OXIMETRY_ONLY"; }).reasons).toEqual(["I3"]);
    expect(label((draft) => { draft.sleepTest.orderedByTreating = false; }).reasons).toEqual(["I4"]);
  });

  it("counts an explicit symptom or a documented comorbidity, and refers vague wording", () => {
    const vague = label((draft) => {
      draft.sleepTest.ahi = 9;
      draft.symptoms = [{ name: "EDS", strength: "vague", text: "a bit tired lately" }];
    });
    expect(vague.label).toBe("REFER");
    expect(vague.reasons).toEqual(["I6:AMBIGUOUS_SYMPTOM"]);

    expect(label((draft) => {
      draft.sleepTest.ahi = 9;
      draft.comorbidities = [{ name: "HTN", documented: true }];
    }).label).toBe("APPROVE");
  });

  it("refers any 3% hypopnea scoring because Medicare uses the 4% rule", () => {
    const nearThreshold = label((draft) => {
      draft.sleepTest.ahi = 15.2;
      draft.sleepTest.hypopneaRule = "3pct";
    });
    expect(nearThreshold.label).toBe("REFER");
    expect(nearThreshold.rules.I5).toBe("met");
    expect(nearThreshold.reasons).toEqual(["SCORING_RULE"]);

    const farFromThreshold = label((draft) => {
      draft.sleepTest.ahi = 30;
      draft.sleepTest.hypopneaRule = "3pct";
    });
    expect(farFromThreshold.label).toBe("REFER");
    expect(farFromThreshold.reasons).toEqual(["SCORING_RULE"]);
  });

  it("refers when the documents conflict, even if the canonical facts would approve", () => {
    const result = label((draft) => {
      draft.conflicts = [{ field: "sleepTest.ahi", values: ["22", "8"], docs: ["D3", "D2"] }];
    });
    expect(result.label).toBe("REFER");
    expect(result.reasons).toContain("CONFLICT");
    expect(result.rules.I5).toBe("met");
  });

  it("refers when both indexes are missing", () => {
    const result = label((draft) => {
      draft.sleepTest.ahi = null;
      draft.sleepTest.rdi = null;
    });
    expect(result.rules.I5).toBe("unclear");
    expect(result.rules.I6).toBe("unclear");
    expect(result.label).toBe("REFER");
  });

  it("rejects continuation facts", () => {
    expect(() => label((draft) => { draft.requestType = "continuation"; })).toThrow(/out of scope/);
  });
});
