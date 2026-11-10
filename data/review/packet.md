# Hand review

Thirty synthetic cases, five from each slice. The label comes from the rules engine. Confirm the label matches the notes.
Record the result in `data/review/handcheck.json` as `{ "cases": [{ "caseId": "case-0001", "ok": true }] }`.
A live model run refuses to start until 30 cases are marked ok.

## case-0001

Slice: clean_approve. Tags: NONE. Label: APPROVE.
Reasons: none.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 19 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. Symptoms: Excessive daytime sleepiness. Epworth Sleepiness Scale score 14. Falls asleep while driving.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 6 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0031

Slice: clean_approve. Tags: NONE. Label: APPROVE.
Reasons: none.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 49 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: unattended home sleep test, Type III.
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 21 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0061

Slice: clean_approve. Tags: NONE. Label: APPROVE.
Reasons: none.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 29 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 26 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0090

Slice: clean_approve. Tags: NONE. Label: APPROVE.
Reasons: none.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 58 years. Sex: X.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: unattended home sleep test, Type II.
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 30 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0120

Slice: clean_approve. Tags: NONE. Label: APPROVE.
Reasons: none.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 38 years. Sex: X.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: unattended home sleep test, Type IV, with 4 channels.
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 35 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0121

Slice: clean_refer. Tags: NONE. Label: REFER.
Reasons: I5, I6.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 19 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 1 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0136

Slice: clean_refer. Tags: NONE. Label: REFER.
Reasons: I5, I6.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 34 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 4 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0151

Slice: clean_refer. Tags: WRONG_TEST. Label: REFER.
Reasons: I3.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | not_met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: overnight oximetry only.
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 22 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0165

Slice: clean_refer. Tags: WRONG_TEST. Label: REFER.
Reasons: I3.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | not_met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: overnight oximetry only.
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 22 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0180

Slice: clean_refer. Tags: WRONG_TEST. Label: REFER.
Reasons: I3.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | not_met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: unattended home sleep test, Type IV, with 2 channels.
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 22 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0181

Slice: borderline. Tags: BORDERLINE_AHI. Label: REFER.
Reasons: I5, I6.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 4.8 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0196

Slice: borderline. Tags: BORDERLINE_AHI. Label: APPROVE.
Reasons: none.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. Symptoms: Insomnia is documented, with trouble staying asleep most nights.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 14 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0211

Slice: borderline. Tags: POLICY_GAP, BORDERLINE_AHI. Label: REFER.
Reasons: POLICY_GAP.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. Symptoms: Excessive daytime sleepiness. Epworth Sleepiness Scale score 14. Falls asleep while driving.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 14.1 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0225

Slice: borderline. Tags: POLICY_GAP, BORDERLINE_AHI. Label: REFER.
Reasons: POLICY_GAP.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. Symptoms: Excessive daytime sleepiness. Epworth Sleepiness Scale score 14. Falls asleep while driving.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 14.65 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0240

Slice: borderline. Tags: SHORT_SLEEP. Label: REFER.
Reasons: I7.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | met |
| I7 | not_met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. Symptoms: Excessive daytime sleepiness. Epworth Sleepiness Scale score 14. Falls asleep while driving.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 9 events/hour.
5. Recorded sleep: 90 minutes.
6. Total events: 9.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0241

Slice: missing. Tags: MISSING_DATA. Label: REFER.
Reasons: I1.

| Rule | Status |
| --- | --- |
| I1 | unclear |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age is not documented. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 22 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0256

Slice: missing. Tags: MISSING_DATA. Label: REFER.
Reasons: I2.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | unclear |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. A clinical evaluation by the treating practitioner is mentioned. The evaluation date is not documented.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 22 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0271

Slice: missing. Tags: MISSING_DATA. Label: REFER.
Reasons: I3.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | unclear |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. A sleep test is mentioned. The test type is not documented.
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 22 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0285

Slice: missing. Tags: MISSING_DATA. Label: REFER.
Reasons: I3.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | unclear |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. A sleep test is mentioned. The test type is not documented.
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 22 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0300

Slice: missing. Tags: MISSING_DATA. Label: REFER.
Reasons: I5, I6.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | unclear |
| I6 | unclear |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI is not documented.
5. RDI is not documented.
6. Recorded sleep: 240 minutes.
7. Total events: 88.
8. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0301

Slice: conflict. Tags: CONFLICT. Label: REFER.
Reasons: CONFLICT.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. The clinic note states AHI 8 events/hour.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 18 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0316

Slice: conflict. Tags: CONFLICT. Label: REFER.
Reasons: CONFLICT.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. The clinic note states AHI 8 events/hour.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 18 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0331

Slice: conflict. Tags: CONFLICT. Label: REFER.
Reasons: CONFLICT.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.
4. The referral lists the clinical evaluation on 2024-04-15.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 22 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0345

Slice: conflict. Tags: CONFLICT. Label: REFER.
Reasons: CONFLICT.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.
4. The referral lists the clinical evaluation on 2024-04-15.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 22 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0360

Slice: conflict. Tags: CONFLICT. Label: REFER.
Reasons: CONFLICT.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | met |
| I6 | not_met |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.
4. The referral lists the clinical evaluation on 2024-04-15.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 22 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0361

Slice: ambiguous. Tags: AMBIGUOUS_SYMPTOM. Label: REFER.
Reasons: I6:AMBIGUOUS_SYMPTOM.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | unclear |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. Symptoms: Feels a bit tired lately.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 6 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0371

Slice: ambiguous. Tags: AMBIGUOUS_SYMPTOM. Label: REFER.
Reasons: I6:AMBIGUOUS_SYMPTOM.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | unclear |
| I7 | met |

#### D1 referral

1. Please review this initial request for CPAP (E0601), a 12-week trial.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. Symptoms: Feels a bit tired lately.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 8 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0381

Slice: ambiguous. Tags: AMBIGUOUS_SYMPTOM. Label: REFER.
Reasons: I6:AMBIGUOUS_SYMPTOM.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | unclear |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. Symptoms: Feels a bit tired lately.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 10 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

#### D4 cover

1. Cover sheet: initial CPAP request (E0601). See the clinical note and the sleep report.

- [ ] The label matches the notes.

## case-0390

Slice: ambiguous. Tags: AMBIGUOUS_SYMPTOM. Label: REFER.
Reasons: I6:AMBIGUOUS_SYMPTOM.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | unclear |
| I7 | met |

#### D1 referral

1. Request: initial coverage of CPAP therapy, HCPCS E0601, for 12 weeks.
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. Symptoms: Feels a bit tired lately.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 11 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

## case-0400

Slice: ambiguous. Tags: AMBIGUOUS_SYMPTOM. Label: REFER.
Reasons: I6:AMBIGUOUS_SYMPTOM.

| Rule | Status |
| --- | --- |
| I1 | met |
| I2 | met |
| I3 | met |
| I4 | met |
| I5 | not_met |
| I6 | unclear |
| I7 | met |

#### D1 referral

1. Referral for an initial 12-week CPAP trial (E0601).
2. Patient age: 52 years. Sex: F.
3. Treating practitioner requests coverage under Medicare NCD 240.4.

#### D2 clinic_note

1. In-person clinical evaluation by the treating practitioner on 2024-03-01.
2. Symptoms: Feels a bit tired lately.

#### D3 sleep_report

1. Test type: attended polysomnography in a sleep laboratory (PSG).
2. Sleep test date: 2024-03-20.
3. The sleep test was ordered by the treating practitioner.
4. AHI: 13 events/hour.
5. Recorded sleep: 240 minutes.
6. Total events: 88.
7. Hypopnea scoring uses a 4% oxygen desaturation rule.

- [ ] The label matches the notes.

