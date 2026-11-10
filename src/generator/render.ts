import type { CaseFacts, ReviewDocument } from "../types.js";

const INTROS = [
  "Referral for an initial 12-week CPAP trial (E0601).",
  "Please review this initial request for CPAP (E0601), a 12-week trial.",
  "Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.",
];

const COMORBIDITY_LABEL = {
  HTN: "hypertension",
  IHD: "ischemic heart disease",
  STROKE_HX: "history of stroke",
} as const;

export function formatNum(value: number): string {
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function renderDocuments(facts: CaseFacts, index: number): ReviewDocument[] {
  const intro = INTROS[index % INTROS.length] ?? INTROS[0]!;
  const referral = [intro];
  if (facts.patient.age == null) {
    referral.push(`Patient age is not documented. Sex: ${facts.patient.sex}.`);
  } else {
    referral.push(`Patient age: ${facts.patient.age} years. Sex: ${facts.patient.sex}.`);
  }
  referral.push("Treating practitioner requests coverage under Medicare NCD 240.4.");
  const dateConflict = facts.conflicts.find((item) => item.field === "clinicalEval.date");
  if (dateConflict?.values[1]) {
    referral.push(`The referral lists the clinical evaluation on ${dateConflict.values[1]}.`);
  }

  const clinic = [evaluationLine(facts)];
  for (const symptom of facts.symptoms) {
    if (symptom.strength === "absent") continue;
    clinic.push(`Symptoms: ${symptom.text}`);
  }
  for (const item of facts.comorbidities) {
    if (!item.documented) continue;
    clinic.push(`Comorbidities: ${COMORBIDITY_LABEL[item.name]} is documented.`);
  }
  const ahiConflict = facts.conflicts.find((item) => item.field === "sleepTest.ahi");
  if (ahiConflict?.values[1]) {
    clinic.push(`The clinic note states AHI ${ahiConflict.values[1]} events/hour.`);
  }

  const sleep = [testTypeLine(facts)];
  sleep.push(
    facts.sleepTest.date
      ? `Sleep test date: ${facts.sleepTest.date}.`
      : "The sleep test date is not documented.",
  );
  sleep.push(orderedLine(facts));
  sleep.push(...indexLines(facts));
  if (facts.sleepTest.recordedSleepMin != null) {
    sleep.push(`Recorded sleep: ${facts.sleepTest.recordedSleepMin} minutes.`);
  }
  if (facts.sleepTest.totalEvents != null) {
    sleep.push(`Total events: ${facts.sleepTest.totalEvents}.`);
  }
  if (facts.sleepTest.hypopneaRule === "4pct") {
    sleep.push("Hypopnea scoring uses a 4% oxygen desaturation rule.");
  } else if (facts.sleepTest.hypopneaRule === "3pct") {
    sleep.push("Hypopnea scoring uses a 3% oxygen desaturation rule.");
  }

  const documents: ReviewDocument[] = [
    { docId: "D1", kind: "referral", date: facts.clinicalEval.date, lines: referral },
    { docId: "D2", kind: "clinic_note", date: facts.clinicalEval.date, lines: clinic },
    { docId: "D3", kind: "sleep_report", date: facts.sleepTest.date, lines: sleep },
  ];
  if (index % 4 === 0) {
    documents.push({
      docId: "D4",
      kind: "cover",
      date: null,
      lines: ["Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report."],
    });
  }
  return documents;
}

function evaluationLine(facts: CaseFacts): string {
  const evaluation = facts.clinicalEval;
  if (!evaluation.present) return "No clinical evaluation is documented.";
  if (evaluation.mode === "telehealth") {
    return `Clinical evaluation on ${evaluation.date ?? "an unknown date"} was by telehealth only.`;
  }
  if (evaluation.date == null) {
    return "A clinical evaluation by the treating practitioner is mentioned. The evaluation date is not documented.";
  }
  if (evaluation.mode == null) {
    return `A clinical evaluation by the treating practitioner is dated ${evaluation.date}. The mode of the visit is not documented.`;
  }
  if (evaluation.byTreating === false) {
    return `In-person clinical evaluation on ${evaluation.date}. The note does not show it was done by the treating practitioner.`;
  }
  return `In-person clinical evaluation by the treating practitioner on ${evaluation.date}.`;
}

function testTypeLine(facts: CaseFacts): string {
  const test = facts.sleepTest;
  switch (test.type) {
    case "PSG_ATTENDED":
      return "Test type: attended polysomnography in a sleep laboratory (PSG).";
    case "HST_TYPE_II":
      return "Test type: unattended home sleep test, Type II.";
    case "HST_TYPE_III":
      return "Test type: unattended home sleep test, Type III.";
    case "HST_TYPE_IV":
      return `Test type: unattended home sleep test, Type IV, with ${test.channels ?? "an unstated number of"} channels.`;
    case "OXIMETRY_ONLY":
      return "Test type: overnight oximetry only.";
    default:
      return "A sleep test is mentioned. The test type is not documented.";
  }
}

function orderedLine(facts: CaseFacts): string {
  if (facts.sleepTest.orderedByTreating === true) {
    return "The sleep test was ordered by the treating practitioner.";
  }
  if (facts.sleepTest.orderedByTreating === false) {
    return "The sleep test was not ordered by the treating practitioner.";
  }
  return "It is not documented whether the treating practitioner ordered the sleep test.";
}

function indexLines(facts: CaseFacts): string[] {
  const { ahi, rdi } = facts.sleepTest;
  if (ahi == null && rdi == null) {
    return ["AHI is not documented.", "RDI is not documented."];
  }
  const lines: string[] = [];
  if (ahi != null) lines.push(`AHI: ${formatNum(ahi)} events/hour.`);
  if (rdi != null) lines.push(`RDI: ${formatNum(rdi)} events/hour.`);
  return lines;
}
