# A weekend experiment with fake CPAP cases

This is a small experiment with synthetic CPAP requests and public Medicare rules (NCD 240.4 and LCD L33718). It is not a coverage decision, and it is not clinical advice.

The AI can only approve a request or send it to a nurse. The instruction is: you never deny.

<!-- result:start -->
On this synthetic set, variant B had no consistency-confidence threshold whose 95% Wilson upper bound stayed at or under 5%. Everything in that reading goes to a nurse.
<!-- result:end -->

The chart, once `pnpm demo` has a cache to read, is `reports/charts/headline-coverage.svg`. Each step to the right auto-approves more cases. The band is the 95% Wilson upper bound on how often those approvals are wrong. The dashed line is the error we are willing to accept.

What was hard on purpose: borderline sleep scores, missing paperwork, and notes that disagree.

What this does not prove: how the same setup would behave on real requests. These cases are synthetic.
