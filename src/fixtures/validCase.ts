import type { CaseFacts } from "../types.js";

export function validInitialFacts(caseId = "case-0000", seed = 0): CaseFacts {
  return {
    caseId,
    seed,
    requestType: "initial",
    patient: { age: 52, sex: "F" },
    clinicalEval: {
      present: true,
      date: "2024-03-01",
      mode: "in_person",
      byTreating: true,
    },
    sleepTest: {
      present: true,
      type: "PSG_ATTENDED",
      channels: null,
      date: "2024-03-20",
      orderedByTreating: true,
      ahi: 22,
      rdi: null,
      recordedSleepMin: 240,
      totalEvents: 88,
      hypopneaRule: "4pct",
    },
    symptoms: [],
    comorbidities: [],
    hardCase: ["NONE"],
    conflicts: [],
  };
}
