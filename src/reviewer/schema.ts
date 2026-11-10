import type { ReviewerOutput, RuleStatus } from "../types.js";

const RULE_IDS = ["I1", "I2", "I3", "I4", "I5", "I6", "I7"] as const;
const STATUSES = new Set<RuleStatus>(["met", "not_met", "unclear"]);
const TOP_KEYS = new Set(["decision", "confidence", "criteria", "referReasons", "summary"]);

export type ParseResult = { ok: true; value: ReviewerOutput } | { ok: false; error: string };

export function parseReviewerOutput(text: string): ParseResult {
  const body = stripFence(text.trim());
  if (body == null) return { ok: false, error: "Response is not a JSON object." };
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return { ok: false, error: "Response is not valid JSON." };
  }
  return validate(value);
}

function stripFence(text: string): string | null {
  const fenced = text.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/);
  if (fenced?.[1]) return fenced[1].trim();
  if (text.startsWith("{") && text.endsWith("}")) return text;
  return null;
}

function validate(value: unknown): ParseResult {
  if (!isRecord(value)) return { ok: false, error: "JSON root must be an object." };
  for (const key of Object.keys(value)) {
    if (!TOP_KEYS.has(key)) delete value[key];
  }
  if (value.decision !== "APPROVE" && value.decision !== "REFER") {
    return { ok: false, error: "decision must be APPROVE or REFER." };
  }
  if (typeof value.confidence !== "number" || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1) {
    return { ok: false, error: "confidence must be a number from 0 to 1." };
  }
  if (typeof value.summary !== "string" || value.summary.trim().length === 0) {
    return { ok: false, error: "summary must be a non-empty string." };
  }
  if (value.referReasons !== undefined) {
    if (!Array.isArray(value.referReasons) || value.referReasons.some((item) => typeof item !== "string")) {
      return { ok: false, error: "referReasons must be an array of strings." };
    }
  }
  if (!Array.isArray(value.criteria)) return { ok: false, error: "criteria must be an array." };

  const seen = new Set<string>();
  const criteria: ReviewerOutput["criteria"] = [];
  for (const item of value.criteria) {
    const parsed = parseCriterion(item);
    if (!parsed.ok) return parsed;
    if (seen.has(parsed.value.id)) return { ok: false, error: `Duplicate criterion ${parsed.value.id}.` };
    seen.add(parsed.value.id);
    criteria.push(parsed.value);
  }
  for (const id of RULE_IDS) {
    if (!seen.has(id)) return { ok: false, error: `Missing criterion ${id}.` };
  }

  return {
    ok: true,
    value: {
      decision: value.decision,
      confidence: value.confidence,
      criteria,
      summary: value.summary,
      ...(value.referReasons ? { referReasons: value.referReasons } : {}),
    },
  };
}

function parseCriterion(value: unknown): { ok: true; value: ReviewerOutput["criteria"][number] } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: "Each criterion must be an object." };
  for (const key of Object.keys(value)) {
    if (!["id", "status", "evidence"].includes(key)) delete value[key];
  }
  if (typeof value.id !== "string" || !RULE_IDS.includes(value.id as (typeof RULE_IDS)[number])) {
    return { ok: false, error: "Criterion id must be I1 through I7." };
  }
  if (typeof value.status !== "string" || !STATUSES.has(value.status as RuleStatus)) {
    return { ok: false, error: `Criterion ${value.id} has a bad status.` };
  }
  if (!Array.isArray(value.evidence)) return { ok: false, error: `Criterion ${value.id} needs an evidence array.` };
  const evidence = [];
  for (const quote of value.evidence) {
    if (!isRecord(quote)) return { ok: false, error: "Evidence must be an object." };
    for (const key of Object.keys(quote)) {
      if (key !== "ref" && key !== "quote") delete quote[key];
    }
    if (typeof quote.ref !== "string" || typeof quote.quote !== "string") {
      return { ok: false, error: "Evidence needs ref and quote strings." };
    }
    evidence.push({ ref: quote.ref, quote: quote.quote });
  }
  return { ok: true, value: { id: value.id, status: value.status as RuleStatus, evidence } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sampleOutput(decision: "APPROVE" | "REFER" = "REFER"): ReviewerOutput {
  const met = decision === "APPROVE";
  return {
    decision,
    confidence: met ? 0.9 : 0.4,
    summary: met ? "Every recorded criterion is met." : "At least one criterion is not met, so this goes to a nurse.",
    criteria: RULE_IDS.map((id) => ({
      id,
      status: met ? "met" : id === "I5" ? "not_met" : "met",
      evidence: met || id !== "I5" ? [{ ref: "D3:L4", quote: "AHI: 22 events/hour." }] : [],
    })),
    ...(met ? {} : { referReasons: ["I5"] }),
  };
}
