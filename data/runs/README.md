# Cached Model Responses

This directory contains cached LLM outputs used to rebuild the reliability evaluation reports offline.

## Structure

- `A/responses.jsonl` - Variant A verbal responses (400 cases, temperature 0)
- `A/samples.jsonl` - Variant A consistency samples (2000 draws: 400 cases × 5 samples, temperature 0.7)
- `B/responses.jsonl` - Variant B verbal responses (400 cases, temperature 0)
- `B/samples.jsonl` - Variant B consistency samples (2000 draws: 400 cases × 5 samples, temperature 0.7)
- `legacy/` - First buggy run responses, kept for transparency

## Dataset

All responses are on the synthetic cases in `data/cases.jsonl` (seed 42, 400 initial CPAP requests). The model is `claude-haiku-4-5-20251001`.

## Purpose

The committed cache allows `pnpm demo` to rebuild all charts, metrics, and reports without API calls. This makes the evaluation reproducible and the costs transparent.

## Legacy Responses

The `legacy/` directory contains 400 responses per variant from an earlier run where the tool schema had `decision` first. These responses have `mode: null` and `parsedOk: false`. They are excluded from the current analysis but kept to document the evaluation history.
