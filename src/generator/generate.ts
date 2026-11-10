import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { decide } from "../../policy/rules.js";
import type { ReviewCase } from "../types.js";
import { casePlans, materializeFacts } from "./facts.js";
import { renderDocuments } from "./render.js";

export const DATASET_SEED = 42;

export function generateDataset(seed = DATASET_SEED): ReviewCase[] {
  const plans = casePlans();
  const facts = materializeFacts(seed);
  return facts.map((item, index) => {
    const plan = plans[index];
    if (!plan) throw new Error(`Missing plan for ${item.caseId}`);
    return {
      caseId: item.caseId,
      requestType: "initial",
      slice: plan.slice,
      documents: renderDocuments(item, index),
      truth: decide(item),
      hardCase: plan.hardCase,
      facts: item,
    };
  });
}

export function casesPath(root = process.cwd()): string {
  return path.join(root, "data", "cases.jsonl");
}

export function writeCases(cases: ReviewCase[], file = casesPath()): void {
  mkdirSync(path.dirname(file), { recursive: true });
  const body = cases.map((item) => JSON.stringify(item)).join("\n");
  writeFileSync(file, `${body}\n`);
}

const invoked = process.argv[1]?.includes("generate.ts") || process.argv[1]?.includes("generate.js");
if (invoked) {
  const cases = generateDataset();
  const file = casesPath();
  writeCases(cases, file);
  const counts = new Map<string, number>();
  for (const item of cases) counts.set(item.slice, (counts.get(item.slice) ?? 0) + 1);
  console.log(`Wrote ${cases.length} cases to ${file}`);
  for (const [slice, count] of counts) console.log(`  ${slice}: ${count}`);
}
