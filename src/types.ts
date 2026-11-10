export type SleepTestType =
  | "PSG_ATTENDED"
  | "HST_TYPE_II"
  | "HST_TYPE_III"
  | "HST_TYPE_IV"
  | "OXIMETRY_ONLY";

export type Strength = "explicit" | "vague" | "absent";

export type HardCaseTag =
  | "BORDERLINE_AHI"
  | "POLICY_GAP"
  | "MISSING_DATA"
  | "CONFLICT"
  | "AMBIGUOUS_SYMPTOM"
  | "WRONG_TEST"
  | "SHORT_SLEEP"
  | "SCORING_RULE"
  | "NONE";

export type Slice =
  | "clean_approve"
  | "clean_refer"
  | "borderline"
  | "missing"
  | "conflict"
  | "ambiguous";

export type RuleStatus = "met" | "not_met" | "unclear";

export type Decision = "APPROVE" | "REFER";

export type RuleId = "I1" | "I2" | "I3" | "I4" | "I5" | "I6" | "I7";

export interface CaseFacts {
  caseId: string;
  seed: number;
  requestType: "initial" | "continuation";
  patient: { age: number | null; sex: "F" | "M" | "X" };
  clinicalEval: {
    present: boolean;
    date: string | null;
    mode: "in_person" | "telehealth" | null;
    byTreating: boolean | null;
  };
  sleepTest: {
    present: boolean;
    type: SleepTestType | null;
    channels: number | null;
    date: string | null;
    orderedByTreating: boolean | null;
    ahi: number | null;
    rdi: number | null;
    recordedSleepMin: number | null;
    totalEvents: number | null;
    hypopneaRule: "4pct" | "3pct" | null;
  };
  symptoms: Array<{ name: "EDS" | "COGNITION" | "MOOD" | "INSOMNIA"; strength: Strength; text: string }>;
  comorbidities: Array<{ name: "HTN" | "IHD" | "STROKE_HX"; documented: boolean }>;
  continuation?: {
    therapyStart: string;
    reevalDate: string | null;
    symptomsImproved: Strength;
    nightlyUsageHours: number[];
    adherenceReviewed: boolean | null;
  };
  hardCase: HardCaseTag[];
  conflicts: Array<{ field: string; values: string[]; docs: string[] }>;
}

export interface GroundTruth {
  caseId: string;
  label: Decision;
  rules: Record<RuleId, RuleStatus>;
  reasons: string[];
  policyVersion: string;
}

export interface ReviewDocument {
  docId: string;
  kind: "referral" | "clinic_note" | "sleep_report" | "usage_download" | "reeval_note" | "cover";
  date: string | null;
  lines: string[];
}

export interface ReviewCase {
  caseId: string;
  requestType: "initial" | "continuation";
  slice: Slice;
  documents: ReviewDocument[];
  truth: GroundTruth;
  hardCase: HardCaseTag[];
  facts: CaseFacts;
}

export interface EvidenceQuote {
  ref: string;
  quote: string;
}

export interface CriterionAssessment {
  id: string;
  status: RuleStatus;
  evidence: EvidenceQuote[];
}

export interface ReviewerOutput {
  decision: Decision;
  confidence: number;
  criteria: CriterionAssessment[];
  referReasons?: string[];
  summary: string;
}

export interface RunRecord {
  caseId: string;
  variant: "A" | "B";
  provider: string;
  model: string;
  promptHash: string;
  text: string;
  parsedOk: boolean;
  createdAt: string;
  mode: string;
  temperature: number;
  sample: number | null;
}

export type PromptVariant = "A" | "B";
