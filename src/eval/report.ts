import type { CompareResult, CorrelateResult, EvaluateMetrics, EvaluateResult } from "reliability-eval";
import type { VariantAnalysis } from "./analyze.js";
import { headlineChart, type ChartSeries } from "./charts.js";
import { CONSISTENCY_K, CONSISTENCY_TEMPERATURE } from "./consistency.js";

export interface ConfidenceReport {
  kind: "verbal" | "consistency";
  analysis: VariantAnalysis;
  metrics: EvaluateMetrics | null;
  calibrationN: number;
  binN: number;
  spearman: CorrelateResult | null;
}

export interface VariantBundle {
  variant: "A" | "B";
  model: string | null;
  n: number;
  citations: VariantAnalysis["citations"];
  sampleParseFailures: number;
  sampleDraws: number;
  verbal: ConfidenceReport;
  consistency: ConfidenceReport;
  reliabilitySvg: string | null;
}

export function usedCount(result: EvaluateResult): { calibrationN: number; binN: number } {
  return {
    calibrationN: result.items.filter((item) => item.confidence != null).length,
    binN: result.calibrationCurve.reduce((sum, bin) => sum + bin.count, 0),
  };
}

export function metricsDocument(
  bundles: VariantBundle[],
  verbalComparison: CompareResult | null,
  consistencyComparison: CompareResult | null,
): unknown {
  return {
    n: bundles[0]?.n ?? 0,
    comparison: {
      verbalBrier: verbalComparison,
      consistencyBrier: consistencyComparison,
    },
    variants: Object.fromEntries(bundles.map((bundle) => [bundle.variant, publicVariant(bundle)])),
  };
}

export function writeReportMarkdown(
  bundles: VariantBundle[],
  verbalComparison: CompareResult | null,
  consistencyComparison: CompareResult | null,
): string {
  const better = pickHeadline(bundles);
  const lines = [
    "# CPAP auto-approve demo",
    "",
    "Synthetic initial CPAP requests. Ground truth comes from the rules engine. The model sees the rendered notes. The decision is APPROVE or REFER.",
    "",
    "The safe threshold is the lowest auto-approve threshold whose 95% Wilson upper bound on the false-approve rate is at or under the target. With about 400 cases this can speak to a 5% target, and to 2% only when some threshold clears that bound. It cannot support a 0.1% claim.",
    "",
    `Verbal confidence is the number the model submits, from one tool call at temperature 0. Consistency confidence is the share of ${CONSISTENCY_K} draws at temperature ${CONSISTENCY_TEMPERATURE} that match the majority decision. A tie is referred. A draw that does not parse does not count as agreement, and the denominator stays ${CONSISTENCY_K}.`,
    "",
    "Calibration n is the number of cases with a confidence, which is also the sum of the reliability bins. Parse failures are reported separately and are not auto-approved. Accuracy counts an unparsed case as wrong. A reply can parse and still say APPROVE while marking a required criterion unclear. That stated decision is what gets scored.",
    "",
    "## Guarded Policy",
    "",
    "An offline guarded filter acts on the model's APPROVE decisions: final decision is APPROVE only if (1) the model said APPROVE, AND (2) the model's own criteria statuses satisfy policy requirements (I1, I2, I3, I4, I7 all \"met\", and at least one of I5 or I6 \"met\"); otherwise REFER. This eliminates false approvals where the model said APPROVE but marked a required criterion as \"unclear\" or \"not_met\". Conflicts are not reflected in criteria statuses, so the guarded filter does not catch them. The filter can only reduce approvals, never increase them.",
    "",
    "## Variants",
    "",
    ...bundles.flatMap((bundle) => variantSection(bundle)),
    "## Comparison",
    "",
    wilcoxonLine("consistency Brier", consistencyComparison),
    wilcoxonLine("verbal Brier", verbalComparison),
    "",
    "Variant B's conflict false approvals jumped from 7 in an earlier buggy run to 38 in the current run. The likely cause is the tool schema change: putting `decision` first with no field for conflicts removed B's \"list conflicts first\" step from the forced tool call. The current schema has been reordered for future runs: criteria and referReasons first, decision and confidence last. This should restore the conflict-listing step.",
    "",
    "## Headline",
    "",
    better
      ? `The headline chart uses variant ${better.variant}, with both confidence curves. ${thresholdSentence(better.consistency.analysis.safeAt5, 0.05)}`
      : "No variant produced a headline chart.",
    "",
    "## Limitations",
    "",
    "- The cases are synthetic. This is not an estimate of real prior-auth performance.",
    "- Adult is encoded as age 18 or older. The NCD says adult and does not define it.",
    "- Telehealth-only evaluation is referred in this demo. Confirm the current CMS and DME MAC position before treating that as a coverage rule.",
    "- The event floor follows the NCD wording: it applies when recorded sleep is under 2 hours. The LCD reading is available as `minEvents: \"lcd\"` and is not the default.",
    "- Verbal confidence is often poorly calibrated. If ECE is high or Spearman rho is weak, the threshold is a description of this run, not a number to ship.",
    "- Continuation-of-therapy requests are not in this dataset.",
    "",
  ];
  return lines.join("\n");
}

export function headlineSvg(bundle: VariantBundle, target = 0.05): string {
  const verbal = seriesFrom("Verbal confidence", "#78716c", "#a8a29e", bundle.verbal, target);
  const consistency = seriesFrom("Consistency confidence", "#1c1917", "#b45309", bundle.consistency, target);
  return headlineChart([verbal, consistency], target);
}

export function resultSentence(bundle: VariantBundle): string {
  const point = bundle.consistency.analysis.safeAt5;
  if (!point || point.wilsonUpper == null) {
    return `On this synthetic set, variant ${bundle.variant} had no consistency-confidence threshold whose 95% Wilson upper bound stayed at or under 5%. Everything in that reading goes to a nurse.`;
  }
  return `On this synthetic set, variant ${bundle.variant} could auto-approve ${(point.coverage * 100).toFixed(1)}% of requests at consistency threshold ${point.t.toFixed(2)}, with a 95% Wilson upper bound of ${(point.wilsonUpper * 100).toFixed(1)}% on those approvals. Everything else went to a nurse.`;
}

export function readmeResults(
  bundles: VariantBundle[],
  verbalComparison: CompareResult | null,
  consistencyComparison: CompareResult | null,
): string {
  const model = bundles[0]?.model ?? "unknown";
  const header = `| | ${bundles.flatMap((bundle) => [`${bundle.variant} verbal`, `${bundle.variant} consistency`]).join(" | ")} |`;
  const rule = `| --- | ${bundles.flatMap(() => ["---", "---"]).join(" | ")} |`;
  const row = (label: string, cell: (bundle: VariantBundle, kind: "verbal" | "consistency") => string) =>
    `| ${label} | ${bundles.flatMap((bundle) => [cell(bundle, "verbal"), cell(bundle, "consistency")]).join(" | ")} |`;
  const lines = [
    `Model \`${model}\`. Each verbal reply is one forced tool call at temperature 0. Consistency runs the same case ${CONSISTENCY_K} times at temperature ${CONSISTENCY_TEMPERATURE}; confidence is the share of those draws that match the majority decision, and a tie is referred.`,
    "",
    "Parse failures are replies that do not satisfy the review schema. They are left out of ECE, Brier, Spearman, and the reliability bins, and they are not auto-approved. Calibration n is the count that entered those bins.",
    "",
    header,
    rule,
    row("Accuracy", (bundle, kind) => pct(bundle[kind].metrics?.accuracy)),
    row("ECE", (bundle, kind) => num(bundle[kind].metrics?.ece)),
    row("Brier", (bundle, kind) => num(bundle[kind].metrics?.brier)),
    row("Calibration n", (bundle, kind) => String(bundle[kind].calibrationN)),
    row("Parse failures", (bundle, kind) => `${bundle[kind].analysis.parseFailures} (${pct(bundle[kind].analysis.parseFailureRate)})`),
    row("Spearman rho", (bundle, kind) => (bundle[kind].spearman ? bundle[kind].spearman.rho.toFixed(3) : "n/a")),
    row("Safe at 5%", (bundle, kind) => safeCell(bundle[kind].analysis.safeAt5)),
    row("Safe at 2%", (bundle, kind) => safeCell(bundle[kind].analysis.safeAt2)),
    "",
    ...bundles.map(
      (bundle) =>
        `Variant ${bundle.variant} citation validity ${rate(bundle.citations.rate)} (${bundle.citations.valid} of ${bundle.citations.total} quotes). Sample draws that failed to parse: ${bundle.sampleParseFailures} of ${bundle.sampleDraws}.`,
    ),
    "",
    wilcoxonLine("consistency Brier", consistencyComparison),
    wilcoxonLine("verbal Brier", verbalComparison),
    "",
    "Slice accuracy, the coverage curve, and the reliability diagrams are in [`reports/REPORT.md`](reports/REPORT.md) and [`reports/charts/`](reports/charts/).",
  ];
  return lines.join("\n");
}

function seriesFrom(name: string, color: string, band: string, report: ConfidenceReport, target: number): ChartSeries {
  const marker = target <= 0.02 ? report.analysis.safeAt2 : report.analysis.safeAt5;
  return { name, color, band, points: report.analysis.curve, marker };
}

function variantSection(bundle: VariantBundle): string[] {
  return [
    `### Variant ${bundle.variant}`,
    "",
    `Model: ${bundle.model ?? "unknown"}.`,
    `Citation validity ${rate(bundle.citations.rate)} (${bundle.citations.valid} of ${bundle.citations.total} quotes), checked on the verbal tool replies.`,
    `Sample draws that failed to parse: ${bundle.sampleParseFailures} of ${bundle.sampleDraws}.`,
    "",
    ...confidenceSection(bundle.verbal),
    "",
    "Slice accuracy uses the verbal decision. A parse failure counts as a miss and is not an auto-approval.",
    "",
    ...table(bundle.verbal.analysis.slices),
    "",
    ...confidenceSection(bundle.consistency),
    "",
    "Slice accuracy uses the majority decision. A case whose five draws all failed to parse counts as a miss and is not an auto-approval.",
    "",
    ...table(bundle.consistency.analysis.slices),
    "",
  ];
}

function confidenceSection(report: ConfidenceReport): string[] {
  const { analysis, metrics } = report;
  const label = report.kind === "verbal" ? "Verbal confidence" : "Consistency confidence";
  const guardedLine = analysis.guarded
    ? `Guarded: ${analysis.guarded.approves} approved (${analysis.guarded.correct} correct, ${analysis.guarded.wrong} wrong); overall accuracy ${(analysis.guarded.accuracy * 100).toFixed(1)}%.`
    : null;
  return [
    `#### ${label}`,
    "",
    metrics
      ? `Accuracy ${(metrics.accuracy * 100).toFixed(1)}% on all ${analysis.n} cases, with an unparsed case counted wrong. ECE ${num(metrics.ece)}. Brier ${num(metrics.brier)}. Calibration n ${report.calibrationN} (reliability bins sum to ${report.binN}).`
      : "Calibration metrics were not computed.",
    guardedLine ?? "",
    `Parse failures ${pct(analysis.parseFailureRate)} (${analysis.parseFailures} of ${analysis.n}).`,
    report.spearman
      ? `Spearman rho between confidence and correctness: ${fmt(report.spearman.rho)} (p ${fmt(report.spearman.pValue)}, n ${report.spearman.n}).`
      : "Spearman correlation was not computed.",
    thresholdSentence(analysis.safeAt5, 0.05),
    thresholdSentence(analysis.safeAt2, 0.02),
  ].filter((line) => line !== "");
}

function thresholdSentence(point: VariantAnalysis["safeAt5"], target: number): string {
  const targetPct = `${(target * 100).toFixed(0)}%`;
  if (!point || point.wilsonUpper == null) {
    return `No threshold kept the Wilson upper bound at or under ${targetPct}.`;
  }
  return `At ${targetPct} target error, the lowest safe threshold is t = ${point.t.toFixed(2)}: coverage ${(point.coverage * 100).toFixed(1)}% (${point.n} approvals, ${point.errors} false), Wilson upper bound ${(point.wilsonUpper * 100).toFixed(1)}%.`;
}

function table(rows: VariantAnalysis["slices"]): string[] {
  const header = ["| Slice | n | Accuracy (raw) | False approvals (raw) | Accuracy (guarded) | False approvals (guarded) |", "| --- | --- | --- | --- | --- | --- |"];
  const body = rows.map((row) => `| ${row.name} | ${row.n} | ${(row.accuracy * 100).toFixed(1)}% | ${row.falseApproves} | ${row.guardedAccuracy != null ? (row.guardedAccuracy * 100).toFixed(1) + "%" : "—"} | ${row.guardedFalseApproves ?? "—"} |`);
  return [...header, ...body];
}

export function pickHeadline(bundles: VariantBundle[]): VariantBundle | null {
  if (bundles.length === 0) return null;
  return [...bundles].sort((a, b) => {
    const coverageA = a.consistency.analysis.safeAt5?.coverage ?? -1;
    const coverageB = b.consistency.analysis.safeAt5?.coverage ?? -1;
    if (coverageA !== coverageB) return coverageB - coverageA;
    return (a.consistency.metrics?.ece ?? 1) - (b.consistency.metrics?.ece ?? 1);
  })[0] ?? null;
}

function publicVariant(bundle: VariantBundle): unknown {
  return {
    model: bundle.model,
    citationValidity: bundle.citations.rate,
    citationsValid: bundle.citations.valid,
    citationsTotal: bundle.citations.total,
    sampleParseFailures: bundle.sampleParseFailures,
    sampleDraws: bundle.sampleDraws,
    verbal: publicConfidence(bundle.verbal),
    consistency: publicConfidence(bundle.consistency),
  };
}

function publicConfidence(report: ConfidenceReport): unknown {
  return {
    accuracy: report.metrics?.accuracy ?? null,
    ece: report.metrics?.ece ?? null,
    brier: report.metrics?.brier ?? null,
    calibrationN: report.calibrationN,
    binN: report.binN,
    parseFailures: report.analysis.parseFailures,
    parseFailureRate: report.analysis.parseFailureRate,
    spearman: report.spearman,
    safeAt5: publicPoint(report.analysis.safeAt5),
    safeAt2: publicPoint(report.analysis.safeAt2),
    slices: report.analysis.slices,
    tags: report.analysis.tags,
    guarded: report.analysis.guarded,
  };
}

function publicPoint(point: VariantAnalysis["safeAt5"]): unknown {
  if (!point) return null;
  return {
    t: point.t,
    n: point.n,
    errors: point.errors,
    coverage: point.coverage,
    errorRate: point.errorRate,
    wilsonUpper: point.wilsonUpper,
  };
}

function wilcoxonLine(label: string, comparison: CompareResult | null): string {
  if (!comparison) return `Wilcoxon signed-rank on per-case ${label} was not computed.`;
  return `Wilcoxon signed-rank on per-case ${label}, A versus B: statistic ${fmt(comparison.statistic)}, p ${fmt(comparison.pValue)}, effect size ${fmt(comparison.effectSize)}, n ${comparison.n} cases where the two scores differ, significant at alpha ${comparison.alpha}: ${comparison.significant}.`;
}

function safeCell(point: VariantAnalysis["safeAt5"]): string {
  if (!point || point.wilsonUpper == null) return "none";
  return `t=${point.t.toFixed(2)}, ${(point.coverage * 100).toFixed(1)}%`;
}

function pct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
}

function rate(value: number | null): string {
  if (value == null) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
}

function num(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "n/a";
  return value.toFixed(3);
}

function fmt(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  return value.toFixed(4);
}

export function replaceMarked(source: string, marker: string, replacement: string): string {
  const pattern = new RegExp(`<!-- ${marker}:start -->[\\s\\S]*?<!-- ${marker}:end -->`);
  if (!pattern.test(source)) return source;
  return source.replace(pattern, `<!-- ${marker}:start -->\n${replacement}\n<!-- ${marker}:end -->`);
}
