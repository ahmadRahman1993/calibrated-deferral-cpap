import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compare, correlate, evaluate, scorers, type EvaluateResult, type Provider } from "reliability-eval";
import { plotCalibration } from "reliability-eval/plot";
import { readJsonl } from "../jsonl.js";
import { casesPath } from "../generator/generate.js";
import type { PromptVariant, ReviewCase, RunRecord } from "../types.js";
import { jsonElicitor } from "../reviewer/elicitor.js";
import { buildPrompt } from "../reviewer/prompt.js";
import { promptHash, replayProvider, ResponseCache } from "../reviewer/cachedProvider.js";
import { analyzeScored, analyzeVariant } from "./analyze.js";
import { citationStats } from "./citations.js";
import { CONSISTENCY_K, scoreConsistency } from "./consistency.js";
import {
  headlineSvg,
  metricsDocument,
  pickHeadline,
  readmeResults,
  replaceMarked,
  resultSentence,
  usedCount,
  writeReportMarkdown,
  type ConfidenceReport,
  type VariantBundle,
} from "./report.js";
import { runLive } from "./run.js";

const VARIANTS: PromptVariant[] = ["A", "B"];

export async function rebuildFromCache(root = process.cwd()): Promise<void> {
  const caseFile = casesPath(root);
  if (!existsSync(caseFile)) {
    throw new Error("data/cases.jsonl is missing. Run pnpm generate first.");
  }
  const cases = readJsonl<ReviewCase>(caseFile);
  const bundles: VariantBundle[] = [];
  const verbalResults: EvaluateResult[] = [];
  const consistencyResults: EvaluateResult[] = [];

  for (const variant of VARIANTS) {
    const verbalFile = path.join(root, "data", "runs", variant, "responses.jsonl");
    const sampleFile = path.join(root, "data", "runs", variant, "samples.jsonl");
    if (!existsSync(verbalFile) || !existsSync(sampleFile)) {
      throw new Error(`Missing ${path.relative(root, verbalFile)} or ${path.relative(root, sampleFile)}. Run pnpm eval:live after the 30-case hand review.`);
    }
    const verbalRecords = currentRecords(cases, readJsonl<RunRecord>(verbalFile), variant, "verbal");
    const sampleRecords = currentRecords(cases, readJsonl<RunRecord>(sampleFile), variant, "sample");
    if (sampleRecords.length !== cases.length * CONSISTENCY_K) {
      throw new Error(`Variant ${variant} has ${sampleRecords.length} sample draws, expected ${cases.length * CONSISTENCY_K}.`);
    }
    const model = verbalRecords[0]?.model ?? null;
    if (!model || verbalRecords.length !== cases.length) {
      throw new Error(`Variant ${variant} has ${verbalRecords.length} verbal replies for the current prompt, expected ${cases.length}.`);
    }
    const providerName = verbalRecords[0]?.provider ?? "replay";

    const verbalResult = sortResult(await replayEvaluate(cases, variant, verbalRecords, model, providerName));
    const consistency = scoreConsistency(cases, sampleRecords);
    const consistencyResult = sortResult(
      await replayEvaluate(cases, variant, [], model, providerName, new Map(cases.map((item) => [buildPrompt(item, variant), consistency.texts.get(item.caseId) ?? ""]))),
    );
    const verbalUsed = usedCount(verbalResult);
    const consistencyUsed = usedCount(consistencyResult);
    assertBins(variant, "verbal", verbalUsed);
    assertBins(variant, "consistency", consistencyUsed);

    verbalResults.push(verbalResult);
    consistencyResults.push(consistencyResult);
    const citations = citationStats(cases, verbalRecords);
    bundles.push({
      variant,
      model,
      n: cases.length,
      citations,
      sampleParseFailures: consistency.failedDraws,
      sampleDraws: consistency.draws,
      verbal: confidenceReport("verbal", analyzeVariant(variant, cases, verbalRecords), verbalResult, verbalUsed),
      consistency: confidenceReport(
        "consistency",
        analyzeScored(variant, model, consistency.scored, citations),
        consistencyResult,
        consistencyUsed,
      ),
      reliabilitySvg: plotCalibration(consistencyResult, {
        title: `Variant ${variant} consistency`,
        width: 640,
        height: 640,
      }),
    });
  }

  const verbalComparison = compare(verbalResults[0]!, verbalResults[1]!, { test: "wilcoxon", metric: "brier" });
  const consistencyComparison = compare(consistencyResults[0]!, consistencyResults[1]!, { test: "wilcoxon", metric: "brier" });
  const reports = path.join(root, "reports");
  const charts = path.join(reports, "charts");
  mkdirSync(charts, { recursive: true });
  writeFileSync(path.join(reports, "metrics.json"), `${JSON.stringify(metricsDocument(bundles, verbalComparison, consistencyComparison), null, 2)}\n`);
  writeFileSync(path.join(reports, "REPORT.md"), writeReportMarkdown(bundles, verbalComparison, consistencyComparison));
  const headline = pickHeadline(bundles);
  if (!headline) throw new Error("No variant to chart.");
  writeFileSync(path.join(charts, "headline-coverage.svg"), headlineSvg(headline, 0.05));
  for (const bundle of bundles) {
    if (!bundle.reliabilitySvg) continue;
    writeFileSync(path.join(charts, `reliability-${bundle.variant}.svg`), bundle.reliabilitySvg);
  }
  stampProse(root, resultSentence(headline));
  const readme = path.join(root, "README.md");
  if (existsSync(readme)) {
    writeFileSync(readme, replaceMarked(readFileSync(readme, "utf8"), "results", readmeResults(bundles, verbalComparison, consistencyComparison)));
  }
  console.log(`Rebuilt reports from cache. Headline variant ${headline.variant}.`);
}

function currentRecords(cases: ReviewCase[], records: RunRecord[], variant: PromptVariant, kind: "verbal" | "sample"): RunRecord[] {
  const model = [...records].reverse().find((record) => record.variant === variant && (kind === "sample" ? record.sample != null : record.mode === "verbal"))?.model;
  if (!model) return [];
  const wanted = new Set<string>();
  for (const item of cases) {
    const prompt = buildPrompt(item, variant);
    if (kind === "verbal") {
      wanted.add(promptHash(model, prompt, "verbal"));
    } else {
      for (let index = 0; index < CONSISTENCY_K; index++) wanted.add(promptHash(model, prompt, `sample:${index}`));
    }
  }
  const matched = new Map<string, RunRecord>();
  for (const record of records) {
    if (record.model === model && record.variant === variant && wanted.has(record.promptHash)) {
      matched.set(record.promptHash, record);
    }
  }
  return [...matched.values()];
}

async function replayEvaluate(
  cases: ReviewCase[],
  variant: PromptVariant,
  records: RunRecord[],
  model: string,
  name: string,
  scripted?: Map<string, string>,
): Promise<EvaluateResult> {
  const provider = scripted ? scriptedProvider(model, name, scripted) : replayFrom(records, model, name);
  return evaluate({
    provider,
    dataset: cases.map((item) => ({
      id: item.caseId,
      input: buildPrompt(item, variant),
      expected: item.truth.label,
    })),
    scorer: scorers.exact(),
    elicitConfidence: jsonElicitor,
    bins: 10,
    concurrency: 8,
  });
}

function replayFrom(records: RunRecord[], model: string, name: string): Provider {
  const cache = new ResponseCache(":memory:");
  cache.seed(records);
  return replayProvider(cache, model, name, "verbal");
}

function scriptedProvider(model: string, name: string, byPrompt: Map<string, string>): Provider {
  return {
    name,
    model,
    async generate(prompt) {
      const text = byPrompt.get(prompt);
      if (text == null) throw new Error(`No scripted response for ${model}.`);
      return { text, raw: text };
    },
  };
}

function confidenceReport(
  kind: "verbal" | "consistency",
  analysis: ConfidenceReport["analysis"],
  result: EvaluateResult,
  used: { calibrationN: number; binN: number },
): ConfidenceReport {
  return {
    kind,
    analysis,
    metrics: result.metrics,
    calibrationN: used.calibrationN,
    binN: used.binN,
    spearman: safeSpearman(result),
  };
}

function assertBins(variant: PromptVariant, kind: string, used: { calibrationN: number; binN: number }): void {
  if (used.calibrationN !== used.binN) {
    throw new Error(`Variant ${variant} ${kind} calibration n ${used.calibrationN} does not match reliability bins ${used.binN}.`);
  }
}

function sortResult(result: EvaluateResult): EvaluateResult {
  return { ...result, items: [...result.items].sort((a, b) => a.id.localeCompare(b.id)) };
}

function safeSpearman(result: EvaluateResult) {
  try {
    return correlate(result, { test: "spearman", x: "confidence", y: "correct" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Spearman was not computed: ${message}`);
    return null;
  }
}

function stampProse(root: string, sentence: string): void {
  const file = path.join(root, "SUMMARY.md");
  if (!existsSync(file)) return;
  writeFileSync(file, replaceMarked(readFileSync(file, "utf8"), "result", sentence));
}

const invoked = process.argv[1]?.includes("demo.ts") || process.argv[1]?.includes("demo.js");
if (invoked) {
  if (process.argv.includes("--live")) {
    for (const variant of VARIANTS) await runLive(variant);
  }
  await rebuildFromCache();
}
