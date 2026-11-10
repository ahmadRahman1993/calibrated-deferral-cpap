import { readFileSync } from "node:fs";

export function readJsonl<T>(file: string): T[] {
  const text = readFileSync(file, "utf8").trim();
  if (text.length === 0) return [];
  return text.split("\n").map((line, index) => {
    try {
      return JSON.parse(line) as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${file}:${index + 1} ${message}`);
    }
  });
}
