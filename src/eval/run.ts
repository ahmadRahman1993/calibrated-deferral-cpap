import path from "node:path";
import { evaluate, scorers } from "reliability-eval";
import { readJsonl } from "../jsonl.js";
import { casesPath } from "../generator/generate.js";
import { assertHandcheck } from "../generator/handcheck.js";
import type { PromptVariant, ReviewCase, RunRecord } from "../types.js";
import { cachedProvider, caseIdsByHash, promptHash, ResponseCache, VERBAL_TEMPERATURE } from "../reviewer/cachedProvider.js";
import { jsonElicitor } from "../reviewer/elicitor.js";
import { buildPrompt } from "../reviewer/prompt.js";
import { parseReviewerOutput } from "../reviewer/schema.js";
import { toolProvider } from "../reviewer/toolProvider.js";
import { CONSISTENCY_K, CONSISTENCY_TEMPERATURE } from "./consistency.js";

export async function runLive(variant: PromptVariant): Promise<void> {
  assertHandcheck(path.join(process.cwd(), "data", "review", "handcheck.json"));
  const model = process.env.REVIEW_MODEL;
  if (!model) throw new Error("Set REVIEW_MODEL to the pinned model id before a live run.");
  const cases = readJsonl<ReviewCase>(casesPath());
  await runVerbal(variant, cases, model);
  await runSamples(variant, cases, model);
}

async function runVerbal(variant: PromptVariant, cases: ReviewCase[], model: string): Promise<void> {
  const file = path.join(process.cwd(), "data", "runs", variant, "responses.jsonl");
  const cache = new ResponseCache(file);
  cache.load();
  const base = toolProvider({ model, temperature: VERBAL_TEMPERATURE });
  const provider = cachedProvider(base, cache, {
    variant,
    mode: "verbal",
    temperature: VERBAL_TEMPERATURE,
    caseIdByHash: caseIdsByHash(cases, variant, model, "verbal"),
  });
  const result = await evaluate({
    provider,
    dataset: cases.map((item) => ({
      id: item.caseId,
      input: buildPrompt(item, variant),
      expected: item.truth.label,
    })),
    scorer: scorers.exact(),
    elicitConfidence: jsonElicitor,
    bins: 10,
    concurrency: 4,
    onProgress(done, total) {
      if (done % 25 === 0 || done === total) console.log(`${variant} verbal ${done}/${total}`);
    },
  });
  const failed = result.items.filter((item) => item.confidence == null).length;
  console.log(`${variant} verbal parse failures ${failed}/${result.items.length} cache ${file}`);
}

async function runSamples(variant: PromptVariant, cases: ReviewCase[], model: string): Promise<void> {
  const file = path.join(process.cwd(), "data", "runs", variant, "samples.jsonl");
  const cache = new ResponseCache(file);
  cache.load();
  const base = toolProvider({ model, temperature: CONSISTENCY_TEMPERATURE });
  const jobs: Array<() => Promise<void>> = [];
  for (const item of cases) {
    const prompt = buildPrompt(item, variant);
    for (let sample = 0; sample < CONSISTENCY_K; sample++) {
      const mode = `sample:${sample}`;
      const hash = promptHash(model, prompt, mode);
      jobs.push(async () => {
        if (cache.get(hash)) return;
        const response = await base.generate(prompt, { temperature: CONSISTENCY_TEMPERATURE, maxTokens: 1500 });
        const parsed = parseReviewerOutput(response.text);
        await remember(cache, {
          caseId: item.caseId,
          variant,
          provider: base.name,
          model: base.model,
          promptHash: hash,
          text: response.text,
          parsedOk: parsed.ok,
          createdAt: new Date().toISOString(),
          mode,
          temperature: CONSISTENCY_TEMPERATURE,
          sample,
        });
      });
    }
  }
  await pool(jobs, 4, (done, total) => {
    if (done % 50 === 0 || done === total) console.log(`${variant} samples ${done}/${total}`);
  });
  console.log(`${variant} samples cache ${file}`);
}

let writeChain = Promise.resolve();

function remember(cache: ResponseCache, record: RunRecord): Promise<void> {
  const next = writeChain.then(() => {
    cache.add(record);
  });
  writeChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function pool(jobs: Array<() => Promise<void>>, concurrency: number, onProgress: (done: number, total: number) => void): Promise<void> {
  let next = 0;
  let done = 0;
  const total = jobs.length;
  async function worker(): Promise<void> {
    for (;;) {
      const index = next;
      next += 1;
      const job = jobs[index];
      if (!job) return;
      await job();
      done += 1;
      onProgress(done, total);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

function variantFromArgs(argv: string[]): PromptVariant | "all" {
  const index = argv.indexOf("--variant");
  const value = index === -1 ? "all" : argv[index + 1];
  if (value === "A" || value === "B" || value === "all") return value;
  throw new Error("Use --variant A, --variant B, or omit it to run both.");
}

const invoked = process.argv[1]?.includes("run.ts") || process.argv[1]?.includes("run.js");
if (invoked) {
  const choice = variantFromArgs(process.argv);
  const variants: PromptVariant[] = choice === "all" ? ["A", "B"] : [choice];
  for (const variant of variants) {
    await runLive(variant);
  }
}
