# Two-minute walkthrough

- 0:00 to 0:15. This is a small experiment inspired by Chris Lovejoy's and Anuj Iravane's talks. Fake CPAP cases, public Medicare rules, and one rule for the AI: approve or send to a nurse. Never deny.
- 0:15 to 0:40. First the CMS CPAP policy is written as plain rules, so every fake case has a known right answer. Then a few hundred cases are generated, including messy ones: borderline sleep scores, missing paperwork, notes that disagree.
- 0:40 to 1:05. An AI reviewer reads each case and returns a decision, the quotes it relied on, and how confident it is.
- 1:05 to 1:40. This chart is the point. Each step to the right auto-approves more cases. The line shows how many of those approvals were wrong, and the dashed line is the error we are willing to accept.

<!-- result:start -->
On this synthetic set, variant B had no consistency-confidence threshold whose 95% Wilson upper bound stayed at or under 5%. Everything in that reading goes to a nurse.
<!-- result:end -->

- 1:40 to 2:00. It only works if the AI's confidence means something, which is what the open-source library measures. The useful question is where this experiment is naive.
