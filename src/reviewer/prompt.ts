import { AMBIGUITY_RULES, INITIAL_CRITERIA, POLICY_VERSION } from "../../policy/criteria.js";
import type { PromptVariant, ReviewCase, ReviewDocument } from "../types.js";

export function buildPrompt(reviewCase: Pick<ReviewCase, "caseId" | "documents">, variant: PromptVariant): string {
  const policy = INITIAL_CRITERIA.map(
    (item) => `${item.id}. ${item.plain}\nSource: ${item.source}.\nQuoted policy: "${item.quote}"`,
  ).join("\n\n");
  const ambiguities = AMBIGUITY_RULES.map((item) => `${item.id}. ${item.plain}`).join("\n");
  const documents = reviewCase.documents.map(renderDocument).join("\n\n");
  const task = variant === "B" ? checklistTask() : directTask();

  return [
    "You are a utilization review assistant. You may only output APPROVE or REFER. You never deny. When in doubt, REFER to a nurse.",
    "",
    `Case id: ${reviewCase.caseId}`,
    "",
    "Policy for an initial 12-week CPAP request. Apply these criteria to the documents. Do not use outside knowledge about the patient.",
    "",
    policy,
    "",
    "Ambiguities to apply:",
    ambiguities,
    "",
    "Documents. Cite a line as its doc id and line number, for example D2:L4. A quote must be copied from that line and must not include the L-number prefix.",
    "",
    documents,
    "",
    task,
    "",
    "Submit the review with the tool. decision is APPROVE or REFER. status is exactly met, not_met, or unclear.",
    "Tier A (I5) and tier B (I6) are alternatives: APPROVE when either one is met, even if the other is not_met.",
    "Use this shape:",
    jsonShape(),
  ].join("\n");
}

function directTask(): string {
  return [
    "Task: assess every criterion from I1 through I7. For each one give a status of met, not_met, or unclear, and quote the lines you used.",
    "Then choose APPROVE or REFER. Choose APPROVE when I1, I2, I3, I4, and I7 are met and at least one of I5 or I6 is met, each of those with a quote. The other severity tier may be not_met. Otherwise REFER.",
    "Then give confidence: your probability that this decision matches what a careful nurse reviewer applying the policy would decide.",
    "Then write a 2 to 3 sentence summary for the nurse.",
  ].join("\n");
}

function checklistTask(): string {
  return [
    "Task: work in this order.",
    "1. List anything conflicting across documents before you decide.",
    "2. Assess every criterion from I1 through I7. For each one give a status of met, not_met, or unclear, and quote the lines you used.",
    "3. Choose APPROVE or REFER. Choose APPROVE when I1, I2, I3, I4, and I7 are met and at least one of I5 or I6 is met, each of those with a quote. The other severity tier may be not_met. Otherwise REFER.",
    "4. Give confidence: your probability that this decision matches what a careful nurse reviewer applying the policy would decide.",
    "5. Write a 2 to 3 sentence summary for the nurse.",
  ].join("\n");
}

function renderDocument(document: ReviewDocument): string {
  const lines = document.lines.map((line, index) => `L${index + 1}: ${line}`).join("\n");
  const dated = document.date ? ` date ${document.date}` : "";
  return `${document.docId} (${document.kind}${dated})\n${lines}`;
}

function jsonShape(): string {
  // NOTE: Changing this changes the promptHash and invalidates the response cache.
  // For future runs with a new cache, consider: criteria first, then decision/confidence.
  return [
    "{",
    '  "decision": "APPROVE or REFER",',
    '  "confidence": 0.0,',
    '  "criteria": [',
    '    { "id": "I1", "status": "met", "evidence": [{ "ref": "D1:L2", "quote": "exact line text" }] }',
    "  ],",
    '  "referReasons": [],',
    '  "summary": "2 to 3 sentences."',
    "}",
  ].join("\n");
}

export function promptIncludesGroundTruth(prompt: string): boolean {
  return prompt.includes(POLICY_VERSION);
}
