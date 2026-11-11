import { readFileSync } from "node:fs";
import path from "node:path";
import { parseReviewerOutput } from "../src/reviewer/schema.js";
import type { ReviewCase } from "../src/types.js";

interface Record {
  caseId: string;
  variant: "A" | "B";
  text: string;
  mode: string;
}

function loadCases(): ReviewCase[] {
  const file = path.join(process.cwd(), "data", "cases.jsonl");
  const lines = readFileSync(file, "utf8").trim().split("\n");
  return lines.map((line) => JSON.parse(line));
}

function loadRecords(variant: "A" | "B"): Record[] {
  const file = path.join(process.cwd(), "data", "runs", variant, "responses.jsonl");
  const lines = readFileSync(file, "utf8").trim().split("\n");
  return lines
    .map((line) => JSON.parse(line))
    .filter((r: Record) => r.mode === "verbal");
}

// Guarded policy: auto-approve only if I1-I4 and I7 are "met", and (I5 or I6) is "met"
function isGuardedApprove(text: string): boolean {
  const parsed = parseReviewerOutput(text);
  if (!parsed.ok) return false;
  
  const criteria = parsed.value.criteria;
  const statusMap = new Map(criteria.map(c => [c.id, c.status]));
  
  // Check gates: I1, I2, I3, I4, I7 must all be "met"
  for (const gate of ["I1", "I2", "I3", "I4", "I7"]) {
    if (statusMap.get(gate) !== "met") return false;
  }
  
  // Check severity: at least one of I5 or I6 must be "met"
  const i5 = statusMap.get("I5");
  const i6 = statusMap.get("I6");
  if (i5 !== "met" && i6 !== "met") return false;
  
  return true;
}

function analyzeVariant(variant: "A" | "B") {
  const cases = loadCases();
  const records = loadRecords(variant);
  const caseMap = new Map(cases.map(c => [c.caseId, c]));
  
  let rawApproves = 0;
  let rawCorrect = 0;
  let guardedApproves = 0;
  let guardedCorrect = 0;
  
  let conflictRawApproves = 0;
  let conflictRawWrong = 0;
  let conflictGuardedApproves = 0;
  
  let missingRawApproves = 0;
  let missingRawWrong = 0;
  let missingGuardedApproves = 0;
  
  let borderlineRawApproves = 0;
  let borderlineRawWrong = 0;
  let borderlineGuardedApproves = 0;
  let borderlineGuardedWrong = 0;
  
  for (const record of records) {
    const caseData = caseMap.get(record.caseId);
    if (!caseData) continue;
    
    const parsed = parseReviewerOutput(record.text);
    if (!parsed.ok) continue;
    
    const rawApprove = parsed.value.decision === "APPROVE";
    const guardedApprove = isGuardedApprove(record.text);
    const correct = caseData.truth.label === "APPROVE";
    
    if (rawApprove) {
      rawApproves++;
      if (correct) rawCorrect++;
      
      // Track by slice
      if (caseData.slice === "conflict") {
        conflictRawApproves++;
        if (!correct) conflictRawWrong++;
      } else if (caseData.slice === "missing") {
        missingRawApproves++;
        if (!correct) missingRawWrong++;
      } else if (caseData.slice === "borderline") {
        borderlineRawApproves++;
        if (!correct) borderlineRawWrong++;
      }
    }
    
    if (guardedApprove) {
      guardedApproves++;
      if (correct) guardedCorrect++;
      
      if (caseData.slice === "conflict") {
        conflictGuardedApproves++;
      } else if (caseData.slice === "missing") {
        missingGuardedApproves++;
      } else if (caseData.slice === "borderline") {
        borderlineGuardedApproves++;
        if (!correct) borderlineGuardedWrong++;
      }
    }
  }
  
  console.log(`\n=== Variant ${variant} ===`);
  console.log(`Raw: ${rawApproves} approved, ${rawCorrect} correct, ${rawApproves - rawCorrect} wrong (${((rawCorrect / rawApproves) * 100).toFixed(1)}% accuracy)`);
  console.log(`Guarded: ${guardedApproves} approved, ${guardedCorrect} correct, ${guardedApproves - guardedCorrect} wrong (${((guardedCorrect / guardedApproves) * 100).toFixed(1)}% accuracy)`);
  console.log(`\nConflict slice: ${conflictRawApproves} raw approves (${conflictRawWrong} wrong), ${conflictGuardedApproves} guarded approves`);
  console.log(`Missing slice: ${missingRawApproves} raw approves (${missingRawWrong} wrong), ${missingGuardedApproves} guarded approves`);
  console.log(`Borderline slice: ${borderlineRawApproves} raw approves (${borderlineRawWrong} wrong), ${borderlineGuardedApproves} guarded approves (${borderlineGuardedWrong} wrong)`);
}

analyzeVariant("A");
analyzeVariant("B");
