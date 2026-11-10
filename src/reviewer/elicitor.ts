import type { ConfidenceElicitor } from "reliability-eval";
import { parseReviewerOutput } from "./schema.js";

export const jsonElicitor: ConfidenceElicitor = {
  buildPrompt(original) {
    return original;
  },
  parse(response) {
    const parsed = parseReviewerOutput(response);
    if (!parsed.ok) return { answer: "", confidence: null };
    return { answer: parsed.value.decision, confidence: parsed.value.confidence };
  },
};
