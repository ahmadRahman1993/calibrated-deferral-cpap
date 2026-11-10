import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ReviewCase } from "../types.js";
import { generateDataset } from "./generate.js";

export function selectReviewCases(cases: ReviewCase[], perSlice = 5): ReviewCase[] {
  const bySlice = new Map<string, ReviewCase[]>();
  for (const item of cases) {
    const list = bySlice.get(item.slice) ?? [];
    list.push(item);
    bySlice.set(item.slice, list);
  }
  const picked: ReviewCase[] = [];
  for (const list of bySlice.values()) {
    if (list.length === 0) continue;
    for (let i = 0; i < perSlice; i++) {
      const index = list.length === 1 ? 0 : Math.round((i * (list.length - 1)) / (perSlice - 1));
      const item = list[index];
      if (item && !picked.some((existing) => existing.caseId === item.caseId)) picked.push(item);
    }
  }
  return picked;
}

export function renderPacket(cases: ReviewCase[]): string {
  const picked = selectReviewCases(cases);
  const blocks = picked.map((item) => {
    const rules = Object.entries(item.truth.rules)
      .map(([id, status]) => `| ${id} | ${status} |`)
      .join("\n");
    const docs = item.documents
      .map((document) => {
        const lines = document.lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
        return `#### ${document.docId} ${document.kind}\n\n${lines}`;
      })
      .join("\n\n");
    return [
      `## ${item.caseId}`,
      "",
      `Slice: ${item.slice}. Tags: ${item.hardCase.join(", ")}. Label: ${item.truth.label}.`,
      `Reasons: ${item.truth.reasons.length === 0 ? "none" : item.truth.reasons.join(", ")}.`,
      "",
      "| Rule | Status |",
      "| --- | --- |",
      rules,
      "",
      docs,
      "",
      "- [ ] The label matches the notes.",
      "",
    ].join("\n");
  });
  return [
    "# Hand review",
    "",
    "Thirty synthetic cases, five from each slice. The label comes from the rules engine. Confirm the label matches the notes.",
    "Record the result in `data/review/handcheck.json` as `{ \"cases\": [{ \"caseId\": \"case-0001\", \"ok\": true }] }`.",
    "A live model run refuses to start until 30 cases are marked ok.",
    "",
    ...blocks,
    "",
  ].join("\n");
}

const invoked = process.argv[1]?.includes("reviewPacket.ts") || process.argv[1]?.includes("reviewPacket.js");
if (invoked) {
  const file = path.join(process.cwd(), "data", "review", "packet.md");
  mkdirSync(path.dirname(file), { recursive: true });
  const packet = renderPacket(generateDataset());
  writeFileSync(file, packet);
  console.log(`Wrote ${file}`);
}
