import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Provider } from "reliability-eval";
import type { PromptVariant, ReviewCase, RunRecord } from "../types.js";
import { buildPrompt } from "./prompt.js";
import { parseReviewerOutput } from "./schema.js";

export const VERBAL_TEMPERATURE = 0;

export function promptHash(model: string, prompt: string, mode = "verbal"): string {
  return createHash("sha256").update(model).update("\n").update(mode).update("\n").update(prompt).digest("hex");
}

export class ResponseCache {
  private byHash = new Map<string, RunRecord>();

  constructor(private file: string) {}

  load(): void {
    if (!existsSync(this.file)) return;
    const text = readFileSync(this.file, "utf8").trim();
    if (text.length === 0) return;
    for (const line of text.split("\n")) {
      const record = JSON.parse(line) as RunRecord;
      this.byHash.set(record.promptHash, record);
    }
  }

  seed(records: RunRecord[]): void {
    for (const record of records) this.byHash.set(record.promptHash, record);
  }

  get(hash: string): RunRecord | undefined {
    return this.byHash.get(hash);
  }

  add(record: RunRecord): void {
    this.byHash.set(record.promptHash, record);
    if (this.file === ":memory:") return;
    mkdirSync(path.dirname(this.file), { recursive: true });
    appendFileSync(this.file, `${JSON.stringify(record)}\n`);
  }

  records(): RunRecord[] {
    return [...this.byHash.values()];
  }
}

export function caseIdsByHash(cases: ReviewCase[], variant: PromptVariant, model: string, mode = "verbal"): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of cases) {
    map.set(promptHash(model, buildPrompt(item, variant), mode), item.caseId);
  }
  return map;
}

export function cachedProvider(
  base: Provider,
  cache: ResponseCache,
  meta: { variant: PromptVariant; caseIdByHash: Map<string, string>; mode?: string; temperature?: number },
): Provider {
  const mode = meta.mode ?? "verbal";
  const temperature = meta.temperature ?? VERBAL_TEMPERATURE;
  return {
    name: base.name,
    model: base.model,
    async generate(prompt, opts) {
      const settings = { maxTokens: 1500, temperature, ...opts };
      const hash = promptHash(base.model, prompt, mode);
      const hit = cache.get(hash);
      if (hit) return { text: hit.text, raw: hit.text };
      const response = await base.generate(prompt, settings);
      const caseId = meta.caseIdByHash.get(hash);
      if (!caseId) throw new Error(`No case id for prompt hash ${hash.slice(0, 12)}.`);
      const parsed = parseReviewerOutput(response.text);
      cache.add({
        caseId,
        variant: meta.variant,
        provider: base.name,
        model: base.model,
        promptHash: hash,
        text: response.text,
        parsedOk: parsed.ok,
        createdAt: new Date().toISOString(),
        mode,
        temperature,
        sample: null,
      });
      return { text: response.text, raw: response.raw };
    },
  };
}

export function replayProvider(cache: ResponseCache, model: string, name: string, mode = "verbal"): Provider {
  return {
    name,
    model,
    async generate(prompt) {
      const hash = promptHash(model, prompt, mode);
      const hit = cache.get(hash);
      if (!hit) {
        throw new Error(`Cache miss for ${model} (${hash.slice(0, 12)}). This command does not call a model.`);
      }
      return { text: hit.text, raw: hit.text };
    },
  };
}
