# Synthetic CPAP prior-auth reliability demo

400 synthetic Medicare CPAP requests (NCD 240.4, LCD L33718). The AI may only approve or refer to a nurse. Neither verbal confidence nor 5-sample consistency gave a safe auto-approve threshold at 5% error tolerance.

<!-- result:start -->
On this synthetic set, variant B had no consistency-confidence threshold whose 95% Wilson upper bound stayed at or under 5%. Everything in that reading goes to a nurse.
<!-- result:end -->

## Main failure mode: contradictory notes

**Raw performance (verbal, temperature 0)**:
- Variant A: 197 approved, 99 correct, 98 wrong (50% approval accuracy, 65% overall)
- Variant B: 177 approved, 99 correct, 78 wrong (56% approval accuracy, 70% overall)

**Where it fails**:
- Conflict cases (notes disagree): A approved 60/60 wrongly, B approved 38/60 wrongly
- Missing-data cases: both approved 28/60 wrongly
- Borderline cases: A 10 wrong, B 12 wrong

**Guarded filter** (final = APPROVE only if model said APPROVE and its own criteria checks all pass):
- Variant A: 169 approved, 99 correct, 70 wrong (59% approval accuracy, 72% overall)
- Variant B: 149 approved, 99 correct, 50 wrong (66% approval accuracy, 77% overall)
- Eliminated all 28 missing-data false approvals in each variant
- Conflict approvals unchanged (criteria don't reflect contradictions)

The checklist prompt (variant B) was significantly better calibrated (Wilcoxon p < 0.0001). All quoted citations were real (100% validity).

## Data limitations

Only 274 of 400 case texts are unique. 276 cases have event counts inconsistent with AHI × sleep time. Both overstate precision for Wilson bounds and Wilcoxon tests. No holdout split. Not clinical advice, not affiliated with CMS.
