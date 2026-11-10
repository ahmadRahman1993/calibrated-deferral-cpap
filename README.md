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

`pnpm demo` rebuilds `reports/` from `data/runs/A/responses.jsonl` and `data/runs/B/responses.jsonl`. Until those files exist it exits with an error. It does not call a model.

A live run, after the hand review is recorded in `data/review/handcheck.json` with 30 passing cases:

```bash
export REVIEW_MODEL="the pinned model id"
export REVIEW_PROVIDER="anthropic"   # or openai
export ANTHROPIC_API_KEY="..."       # or OPENAI_API_KEY
pnpm eval:live -- --variant A
pnpm eval:live -- --variant B
pnpm demo
```

`pnpm demo -- --live` runs both variants and then rebuilds the charts. Temperature is 0 and `maxTokens` is 1500, set on the cached provider because `evaluate()` calls `generate` without options. Responses are cached by hash of model plus prompt.

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

Variant A asks for the JSON directly. Variant B requires a conflict list and a per-criterion pass before the decision.

Library: [`reliability-eval`](https://github.com/ahmadRahman1993/reliability-eval). Accuracy, ECE, and Brier come from `evaluate`. The coverage curve and Wilson threshold are local, because that library does not ship them.
