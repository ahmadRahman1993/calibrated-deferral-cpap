import type { ReviewCase, ReviewDocument, RunRecord } from "../types.js";
import { parseReviewerOutput } from "../reviewer/schema.js";

export function normalizeWs(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function lineForRef(documents: ReviewDocument[], ref: string): string | null {
  const match = /^D(\d+):L(\d+)$/.exec(ref.trim());
  if (!match?.[1] || !match[2]) return null;
  const document = documents.find((item) => item.docId === `D${match[1]}`);
  if (!document) return null;
  return document.lines[Number(match[2]) - 1] ?? null;
}

export function quoteInLine(quote: string, line: string): boolean {
  const needle = normalizeWs(quote);
  if (needle.length === 0) return false;
  return normalizeWs(line).includes(needle);
}

export function citationStats(
  cases: ReviewCase[],
  records: RunRecord[],
): { valid: number; total: number; rate: number | null } {
  const byId = new Map(records.map((record) => [record.caseId, record]));
  let valid = 0;
  let total = 0;
  for (const item of cases) {
    const record = byId.get(item.caseId);
    if (!record) continue;
    const parsed = parseReviewerOutput(record.text);
    if (!parsed.ok) continue;
    for (const criterion of parsed.value.criteria) {
      for (const evidence of criterion.evidence) {
        total += 1;
        const line = lineForRef(item.documents, evidence.ref);
        if (line != null && quoteInLine(evidence.quote, line)) valid += 1;
      }
    }
  }
  return { valid, total, rate: total === 0 ? null : valid / total };
}
