import type { ScoredCase } from "./coverage.js";

export interface GroupMetrics {
  name: string;
  n: number;
  accuracy: number;
  falseApproves: number;
}

export function sliceTable(scored: ScoredCase[]): GroupMetrics[] {
  return groupMetrics(scored, (item) => [item.slice]);
}

export function tagTable(scored: ScoredCase[]): GroupMetrics[] {
  return groupMetrics(scored, (item) => item.hardCase);
}

function groupMetrics(scored: ScoredCase[], names: (item: ScoredCase) => string[]): GroupMetrics[] {
  const groups = new Map<string, ScoredCase[]>();
  for (const item of scored) {
    for (const name of names(item)) {
      const list = groups.get(name) ?? [];
      list.push(item);
      groups.set(name, list);
    }
  }
  return [...groups.entries()].map(([name, items]) => ({
    name,
    n: items.length,
    accuracy: items.filter((item) => item.decision === item.label).length / items.length,
    falseApproves: items.filter((item) => item.decision === "APPROVE" && item.label === "REFER").length,
  }));
}
