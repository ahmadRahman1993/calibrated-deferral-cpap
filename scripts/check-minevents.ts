import { readFileSync } from "node:fs";
import path from "node:path";
import { decide } from "../policy/rules.js";
import type { ReviewCase } from "../src/types.js";

const cases: ReviewCase[] = readFileSync(path.join(process.cwd(), "data", "cases.jsonl"), "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));

let changed = 0;
for (const c of cases) {
  const ncd = decide(c.facts, { minEvents: "ncd" });
  const lcd = decide(c.facts, { minEvents: "lcd" });
  if (ncd.label !== lcd.label) {
    changed++;
    console.log("Case", c.caseId, "changes from", ncd.label, "to", lcd.label);
  }
}
console.log("Total cases with label changes:", changed);
