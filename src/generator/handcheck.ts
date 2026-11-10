import { existsSync, readFileSync } from "node:fs";

export const HANDCHECK_REQUIRED = 30;

export function assertHandcheck(file: string): void {
  if (!existsSync(file)) {
    throw new Error(
      `Hand review is not recorded at ${file}. Read data/review/packet.md and write 30 passing cases before a live run.`,
    );
  }
  const parsed = JSON.parse(readFileSync(file, "utf8")) as { cases?: Array<{ caseId?: string; ok?: boolean }> };
  const passes = (parsed.cases ?? []).filter((item) => item.ok === true && typeof item.caseId === "string");
  if (passes.length < HANDCHECK_REQUIRED) {
    throw new Error(`Hand review has ${passes.length} passing cases. ${HANDCHECK_REQUIRED} are required before a live run.`);
  }
}
