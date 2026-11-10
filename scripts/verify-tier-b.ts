import { readFileSync } from "node:fs";
import path from "node:path";

interface Case {
  caseId: string;
  slice: string;
  truth: { label: string; rules: { [key: string]: string } };
  facts: { sleepTest: { ahi: number | null; hypopneaRule: string | null } };
}

interface RecordType {
  caseId: string;
  text: string;
  mode: string;
}

function parseReply(text: string): { decision?: string } {
  const match = text.match(/"decision"\s*:\s*"(APPROVE|REFER)"/);
  return match ? { decision: match[1] } : {};
}

const cases: Case[] = readFileSync(path.join(process.cwd(), "data", "cases.jsonl"), "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));

const recordsB: RecordType[] = readFileSync(path.join(process.cwd(), "data", "runs", "B", "responses.jsonl"), "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line))
  .filter((r: RecordType) => r.mode === "verbal");

const caseMap = new Map(cases.map((c) => [c.caseId, c]));
const recordMap = new Map(recordsB.map((r) => [r.caseId, r]));

// Find clean tier-B misses
const cleanApprove = cases.filter((c) => c.slice === "clean_approve" && c.truth.label === "APPROVE");
const tierBMisses: { caseId: string; ahi: number | null; rule: string | null }[] = [];

for (const c of cleanApprove) {
  const record = recordMap.get(c.caseId);
  if (!record) continue;
  const parsed = parseReply(record.text);
  if (parsed.decision === "REFER") {
    const i5 = c.truth.rules.I5;
    const i6 = c.truth.rules.I6;
    if (i5 === "not_met" && i6 === "met") {
      tierBMisses.push({ caseId: c.caseId, ahi: c.facts.sleepTest.ahi, rule: c.facts.sleepTest.hypopneaRule });
    }
  }
}

console.log("Clean tier-B approval misses in variant B:", tierBMisses.length);
console.log("Hypopnea rules:", tierBMisses.map((m) => m.rule));
console.log("All using 4pct:", tierBMisses.every((m) => m.rule === "4pct"));
