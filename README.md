# CPAP prior-auth reliability demo

A small, public, synthetic-data demo. An LLM reviewer may only say APPROVE or REFER. The question is what share of initial CPAP requests it can auto-approve while the 95% Wilson upper bound on false approvals stays under a chosen error rate.

Ground truth comes from a deterministic rules engine over structured facts. The model only sees rendered notes. Charts are rebuilt from a committed response cache, so `pnpm demo` does not need an API key.

## Policy

Medicare NCD 240.4 (https://www.cms.gov/medicare-coverage-database/view/ncd.aspx?NCDId=226) and LCD L33718, quoted in [`policy/ncd-240-4.md`](policy/ncd-240-4.md) with retrieval date Nov 2, 2026. The rules are [`policy/rules.ts`](policy/rules.ts), ids I1 through I7. Sources are also on each criterion in [`policy/criteria.ts`](policy/criteria.ts).

Severity is met when tier A (I5) or tier B (I6) is met. Anything unresolved, conflicting, or outside the written tiers is REFER. The instructions tell the model: you never deny.

## Reproduce

Node 22 or newer, and pnpm.

```bash
pnpm install
pnpm test
pnpm generate
pnpm review-packet
```

`pnpm generate` writes `data/cases.jsonl` (400 initial requests, seed 42). `pnpm review-packet` writes `data/review/packet.md`, thirty cases to read before any model call.

`pnpm demo` rebuilds `reports/` from the cached verbal replies and the five-draw samples. Until those files exist it exits with an error. It does not call a model.

A live run, after the hand review is recorded in `data/review/handcheck.json` with 30 passing cases:

```bash
export REVIEW_MODEL="the pinned model id"
export REVIEW_PROVIDER="anthropic"   # or openai
export ANTHROPIC_API_KEY="..."       # or OPENAI_API_KEY
pnpm eval:live -- --variant A
pnpm eval:live -- --variant B
pnpm demo
```

`pnpm demo -- --live` runs both variants and then rebuilds the charts. The reviewer is forced to call a tool, so the reply is JSON. The verbal call uses temperature 0. Consistency uses five calls at temperature 0.7; confidence is the share that match the majority decision. `maxTokens` is 1500. Responses are cached by hash of model, mode, and prompt, because `evaluate()` calls `generate` without options.

## Results

<!-- results:start -->
Model `claude-haiku-4-5-20251001`. Each verbal reply is one forced tool call at temperature 0. Consistency runs the same case 5 times at temperature 0.7; confidence is the share of those draws that match the majority decision, and a tie is referred.

Parse failures are replies that do not satisfy the review schema. They are left out of ECE, Brier, Spearman, and the reliability bins, and they are not auto-approved. Calibration n is the count that entered those bins.

| | A verbal | A consistency | B verbal | B consistency |
| --- | --- | --- | --- | --- |
| Accuracy | 65.0% | 65.3% | 70.0% | 70.8% |
| ECE | 0.296 | 0.337 | 0.243 | 0.270 |
| Brier | 0.312 | 0.336 | 0.267 | 0.276 |
| Calibration n | 400 | 400 | 400 | 400 |
| Parse failures | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) |
| Spearman rho | 0.161 | 0.133 | 0.186 | 0.135 |
| Safe at 5% | none | none | none | none |
| Safe at 2% | none | none | none | none |

Variant A citation validity 100.0% (2914 of 2914 quotes). Sample draws that failed to parse: 3 of 2000.
Variant B citation validity 100.0% (2949 of 2949 quotes). Sample draws that failed to parse: 2 of 2000.

Wilcoxon signed-rank on per-case consistency Brier, A versus B: statistic 1799.5000, p 0.0001, effect size 0.5341, n 68 cases where the two scores differ, significant at alpha 0.05: true.
Wilcoxon signed-rank on per-case verbal Brier, A versus B: statistic 1242.0000, p 0.0001, effect size 0.6130, n 55 cases where the two scores differ, significant at alpha 0.05: true.

Slice accuracy, the coverage curve, and the reliability diagrams are in [`reports/REPORT.md`](reports/REPORT.md) and [`reports/charts/`](reports/charts/).
<!-- results:end -->

Copy `send-denylist.example.txt` to `send-denylist.txt` and add employer terms before sending. That file is gitignored. `pnpm check:send` runs the pre-send checks.

## Layout

| Path | What it is |
| --- | --- |
| `policy/rules.ts` | Ground truth |
| `src/generator/` | Seeded facts, hard cases, note renderer |
| `src/reviewer/` | Prompts A and B, JSON schema, record/replay |
| `src/eval/` | Wilson bound, coverage curve, citations, charts |
| `SUMMARY.md` | One page for a non-engineer |
| `reports/` | Numbers and charts produced by `pnpm demo` |

Variant A asks for the decision directly. Variant B requires a conflict list and a per-criterion pass before the decision. Both submit through the same tool.

Library: [`reliability-eval`](https://github.com/ahmadRahman1993/reliability-eval). Accuracy, ECE, and Brier come from `evaluate`. The coverage curve and Wilson threshold are local, because that library does not ship them.
