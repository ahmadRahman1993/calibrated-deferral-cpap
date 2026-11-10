import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const SKIP = new Set(["node_modules", "dist", "coverage", ".git"]);

export function walkTextFiles(root: string, visit: (file: string) => void): void {
  for (const entry of readdirSync(root)) {
    if (SKIP.has(entry)) continue;
    const full = path.join(root, entry);
    const info = statSync(full);
    if (info.isDirectory()) {
      walkTextFiles(full, visit);
      continue;
    }
    if (info.size > 5_000_000) continue;
    if (/\.(ts|md|json|jsonl|svg|txt)$/.test(entry)) visit(full);
  }
}

export function findForbiddenLines(root: string): string[] {
  const stem = ["de", "ny"].join("");
  const pattern = new RegExp(`\\b${stem}\\b|\\b${stem}ied\\b`, "i");
  const hits: string[] = [];
  walkTextFiles(root, (file) => {
    if (file.endsWith(`${path.sep}SPEC.md`)) return;
    if (file.endsWith(`${path.sep}ncd-240-4.md`)) return;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (!pattern.test(line)) return;
      if (/never deny/i.test(line) || /never-deny/i.test(line)) return;
      hits.push(`${path.relative(root, file)}:${index + 1}: ${line.trim()}`);
    });
  });
  return hits;
}
