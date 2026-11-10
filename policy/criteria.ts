import type { RuleId } from "../src/types.js";

export const POLICY_VERSION = "NCD240.4-v3+LCD-L33718-R11";

export interface Criterion {
  id: RuleId;
  plain: string;
  source: string;
  quote: string;
}

export const INITIAL_CRITERIA: readonly Criterion[] = [
  {
    id: "I1",
    plain: "The patient is an adult. This demo encodes adult as age 18 or older.",
    source: "NCD 240.4",
    quote:
      "An initial 12-week period of CPAP is covered in adult patients with OSA if either of the following criterion using the AHI or RDI are met.",
  },
  {
    id: "I2",
    plain: "A clinical evaluation by the treating practitioner is documented before the sleep test. The LCD requires that evaluation to be in person. Telehealth-only is referred.",
    source: "NCD 240.4 + LCD L33718",
    quote:
      "The beneficiary has an in-person clinical evaluation by the treating practitioner prior to the sleep test to assess the beneficiary for obstructive sleep apnea.",
  },
  {
    id: "I3",
    plain: "The sleep test is an attended in-lab PSG, an HST Type II, an HST Type III, or an HST Type IV that measures at least 3 channels.",
    source: "NCD 240.4",
    quote:
      "A positive diagnosis of OSA for the coverage of CPAP must include a clinical evaluation and a positive: a. attended PSG performed in a sleep laboratory; or b. unattended HST with a Type II home sleep monitoring device; or c. unattended HST with a Type III home sleep monitoring device; or d. unattended HST with a Type IV home sleep monitoring device that measures at least 3 channels.",
  },
  {
    id: "I4",
    plain: "The sleep test was ordered by the treating practitioner.",
    source: "NCD 240.4",
    quote: "previously ordered by the beneficiary's treating physician",
  },
  {
    id: "I5",
    plain: "Severity tier A: AHI or RDI is 15 or more events per hour. Either index qualifies unless strictIndex is on, in which case only AHI counts.",
    source: "NCD 240.4",
    quote:
      "a. AHI or RDI greater than or equal to 15 events per hour, or b. AHI or RDI greater than or equal to 5 events and less than or equal to 14 events per hour with documented symptoms of excessive daytime sleepiness, impaired cognition, mood disorders or insomnia, or documented hypertension, ischemic heart disease, or history of stroke.",
  },
  {
    id: "I6",
    plain: "Severity tier B: AHI or RDI is from 5 through 14, and at least one qualifying symptom or comorbidity is documented explicitly. Vague wording does not count.",
    source: "NCD 240.4",
    quote:
      "b. AHI or RDI greater than or equal to 5 events and less than or equal to 14 events per hour with documented symptoms of excessive daytime sleepiness, impaired cognition, mood disorders or insomnia, or documented hypertension, ischemic heart disease, or history of stroke.",
  },
  {
    id: "I7",
    plain: "If recorded sleep is under 2 hours, total events must reach the 2-hour equivalent: 30 when tier A is the qualifying tier, 10 when only tier B qualifies. Under the default NCD reading this floor does not apply when sleep is at least 2 hours.",
    source: "NCD 240.4",
    quote:
      "If the AHI or RDI is calculated based on less than 2 hours of continuous recorded sleep, the total number of recorded events to calculate the AHI or RDI during sleep testing must be at a minimum the number of events that would have been required in a 2-hour period.",
  },
];

export const AMBIGUITY_RULES: readonly { id: string; plain: string }[] = [
  {
    id: "A1",
    plain: "An index strictly between 14 and 15 fits neither tier. Refer with reason POLICY_GAP.",
  },
  {
    id: "A2",
    plain: "AHI or RDI may qualify. If the two indexes disagree, either one can meet the tier unless the run was configured with strictIndex.",
  },
  {
    id: "A3",
    // NOTE: Rule tightened in implementation to refer any 3% study (not just within 2 events of threshold).
    // Text kept as-is to preserve prompt hash compatibility with existing cache.
    plain: "If the report scores hypopneas with a 3% desaturation rule and the qualifying index is within 2 events of 5 or of 15, refer with reason SCORING_RULE.",
  },
  {
    id: "A4",
    plain: "Only an explicit symptom counts as documented. Vague wording such as feeling a bit tired is not enough. Refer with reason AMBIGUOUS_SYMPTOM.",
  },
  {
    id: "A6",
    plain: "A telehealth-only pre-test evaluation does not meet the LCD in-person rule in this demo. Refer with reason EVAL_MODE.",
  },
];
