# CPAP auto-approve demo

Synthetic initial CPAP requests. Ground truth comes from the rules engine. The model sees the rendered notes. The decision is APPROVE or REFER.

The safe threshold is the lowest auto-approve threshold whose 95% Wilson upper bound on the false-approve rate is at or under the target. With about 400 cases this can speak to a 5% target, and to 2% only when some threshold clears that bound. It cannot support a 0.1% claim.

Verbal confidence is the number the model submits, from one tool call at temperature 0. Consistency confidence is the share of 5 draws at temperature 0.7 that match the majority decision. A tie is referred. A draw that does not parse does not count as agreement, and the denominator stays 5.

Calibration n is the number of cases with a confidence, which is also the sum of the reliability bins. Parse failures are reported separately and are not auto-approved. Accuracy counts an unparsed case as wrong. A reply can parse and still say APPROVE while marking a required criterion unclear. That stated decision is what gets scored.

## Variants

### Variant A

Model: claude-haiku-4-5-20251001.
Citation validity 100.0% (2914 of 2914 quotes), checked on the verbal tool replies.
Sample draws that failed to parse: 3 of 2000.

#### Verbal confidence

Accuracy 65.0% on all 400 cases, with an unparsed case counted wrong. ECE 0.296. Brier 0.312. Calibration n 400 (reliability bins sum to 400).
Parse failures 0.0% (0 of 400).
Spearman rho between confidence and correctness: 0.1608 (p 0.0012, n 400).
No threshold kept the Wilson upper bound at or under 5%.
No threshold kept the Wilson upper bound at or under 2%.

Slice accuracy uses the verbal decision. A parse failure counts as a miss and is not an auto-approval.

| Slice | n | Accuracy | False approvals |
| --- | --- | --- | --- |
| clean_approve | 120 | 75.0% | 0 |
| clean_refer | 60 | 100.0% | 0 |
| borderline | 60 | 63.3% | 10 |
| missing | 60 | 53.3% | 28 |
| conflict | 60 | 0.0% | 60 |
| ambiguous | 40 | 100.0% | 0 |

#### Consistency confidence

Accuracy 65.3% on all 400 cases, with an unparsed case counted wrong. ECE 0.337. Brier 0.336. Calibration n 400 (reliability bins sum to 400).
Parse failures 0.0% (0 of 400).
Spearman rho between confidence and correctness: 0.1330 (p 0.0077, n 400).
No threshold kept the Wilson upper bound at or under 5%.
No threshold kept the Wilson upper bound at or under 2%.

Slice accuracy uses the majority decision. A case whose five draws all failed to parse counts as a miss and is not an auto-approval.

| Slice | n | Accuracy | False approvals |
| --- | --- | --- | --- |
| clean_approve | 120 | 75.0% | 0 |
| clean_refer | 60 | 100.0% | 0 |
| borderline | 60 | 63.3% | 10 |
| missing | 60 | 55.0% | 27 |
| conflict | 60 | 0.0% | 60 |
| ambiguous | 40 | 100.0% | 0 |

### Variant B

Model: claude-haiku-4-5-20251001.
Citation validity 100.0% (2949 of 2949 quotes), checked on the verbal tool replies.
Sample draws that failed to parse: 2 of 2000.

#### Verbal confidence

Accuracy 70.0% on all 400 cases, with an unparsed case counted wrong. ECE 0.243. Brier 0.267. Calibration n 400 (reliability bins sum to 400).
Parse failures 0.0% (0 of 400).
Spearman rho between confidence and correctness: 0.1864 (p 0.0002, n 400).
No threshold kept the Wilson upper bound at or under 5%.
No threshold kept the Wilson upper bound at or under 2%.

Slice accuracy uses the verbal decision. A parse failure counts as a miss and is not an auto-approval.

| Slice | n | Accuracy | False approvals |
| --- | --- | --- | --- |
| clean_approve | 120 | 75.0% | 0 |
| clean_refer | 60 | 100.0% | 0 |
| borderline | 60 | 60.0% | 12 |
| missing | 60 | 53.3% | 28 |
| conflict | 60 | 36.7% | 38 |
| ambiguous | 40 | 100.0% | 0 |

#### Consistency confidence

Accuracy 70.8% on all 400 cases, with an unparsed case counted wrong. ECE 0.270. Brier 0.276. Calibration n 400 (reliability bins sum to 400).
Parse failures 0.0% (0 of 400).
Spearman rho between confidence and correctness: 0.1349 (p 0.0069, n 400).
No threshold kept the Wilson upper bound at or under 5%.
No threshold kept the Wilson upper bound at or under 2%.

Slice accuracy uses the majority decision. A case whose five draws all failed to parse counts as a miss and is not an auto-approval.

| Slice | n | Accuracy | False approvals |
| --- | --- | --- | --- |
| clean_approve | 120 | 75.0% | 0 |
| clean_refer | 60 | 100.0% | 0 |
| borderline | 60 | 61.7% | 11 |
| missing | 60 | 55.0% | 27 |
| conflict | 60 | 38.3% | 37 |
| ambiguous | 40 | 100.0% | 0 |

## Comparison

Wilcoxon signed-rank on per-case consistency Brier, A versus B: statistic 1799.5000, p 0.0001, effect size 0.5341, n 68 cases where the two scores differ, significant at alpha 0.05: true.
Wilcoxon signed-rank on per-case verbal Brier, A versus B: statistic 1242.0000, p 0.0001, effect size 0.6130, n 55 cases where the two scores differ, significant at alpha 0.05: true.

## Headline

The headline chart uses variant B, with both confidence curves. No threshold kept the Wilson upper bound at or under 5%.

## Limitations

- The cases are synthetic. This is not an estimate of real prior-auth performance.
- Adult is encoded as age 18 or older. The NCD says adult and does not define it.
- Telehealth-only evaluation is referred in this demo. Confirm the current CMS and DME MAC position before treating that as a coverage rule.
- The event floor follows the NCD wording: it applies when recorded sleep is under 2 hours. The LCD reading is available as `minEvents: "lcd"` and is not the default.
- Verbal confidence is often poorly calibrated. If ECE is high or Spearman rho is weak, the threshold is a description of this run, not a number to ship.
- Continuation-of-therapy requests are not in this dataset.
