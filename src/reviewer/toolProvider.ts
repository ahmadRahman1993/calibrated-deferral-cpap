import type { Provider } from "reliability-eval";

const RULE_IDS = ["I1", "I2", "I3", "I4", "I5", "I6", "I7"] as const;

export const REVIEW_TOOL_NAME = "submit_review";

export const REVIEW_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["decision", "confidence", "criteria", "summary"],
  properties: {
    decision: { type: "string", enum: ["APPROVE", "REFER"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    criteria: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "status", "evidence"],
        properties: {
          id: { type: "string", enum: [...RULE_IDS] },
          status: { type: "string", enum: ["met", "not_met", "unclear"] },
          evidence: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["ref", "quote"],
              properties: {
                ref: { type: "string" },
                quote: { type: "string" },
              },
            },
          },
        },
      },
    },
    referReasons: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
} as const;

export function toolProvider(opts: { model: string; temperature: number; provider?: string }): Provider {
  const which = opts.provider ?? process.env.REVIEW_PROVIDER ?? "anthropic";
  if (which === "openai") return openaiTools(opts.model, opts.temperature);
  if (which === "anthropic") return anthropicTools(opts.model, opts.temperature);
  throw new Error(`Set REVIEW_PROVIDER to anthropic or openai. Got ${which}.`);
}

function anthropicTools(model: string, temperature: number): Provider {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  return {
    name: "anthropic",
    model,
    async generate(prompt, genOpts) {
      const response = await postJson(
        "https://api.anthropic.com/v1/messages",
        {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        {
          model,
          max_tokens: genOpts?.maxTokens ?? 1500,
          temperature: genOpts?.temperature ?? temperature,
          tools: [
            {
              name: REVIEW_TOOL_NAME,
              description: "Submit the utilization review. status is only met, not_met, or unclear. decision is only APPROVE or REFER.",
              input_schema: REVIEW_INPUT_SCHEMA,
            },
          ],
          tool_choice: { type: "tool", name: REVIEW_TOOL_NAME },
          messages: [{ role: "user", content: prompt }],
        },
      );
      const blocks = Array.isArray(response.content) ? response.content : [];
      const tool = blocks.find((block) => isRecord(block) && block.type === "tool_use" && block.name === REVIEW_TOOL_NAME);
      const input = isRecord(tool) ? tool.input : undefined;
      return {
        text: input === undefined ? "" : JSON.stringify(input),
        raw: { model: response.model, usage: response.usage, stop_reason: response.stop_reason },
      };
    },
  };
}

function openaiTools(model: string, temperature: number): Provider {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  return {
    name: "openai",
    model,
    async generate(prompt, genOpts) {
      const response = await postJson(
        "https://api.openai.com/v1/chat/completions",
        {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        {
          model,
          max_tokens: genOpts?.maxTokens ?? 1500,
          temperature: genOpts?.temperature ?? temperature,
          messages: [{ role: "user", content: prompt }],
          tools: [
            {
              type: "function",
              function: {
                name: REVIEW_TOOL_NAME,
                description: "Submit the utilization review. status is only met, not_met, or unclear. decision is only APPROVE or REFER.",
                parameters: REVIEW_INPUT_SCHEMA,
              },
            },
          ],
          tool_choice: { type: "function", function: { name: REVIEW_TOOL_NAME } },
        },
      );
      const choices = Array.isArray(response.choices) ? response.choices : [];
      const message = isRecord(choices[0]) ? choices[0].message : undefined;
      const calls = isRecord(message) && Array.isArray(message.tool_calls) ? message.tool_calls : [];
      const call = calls.find((item) => isRecord(item) && isRecord(item.function) && item.function.name === REVIEW_TOOL_NAME);
      const args = isRecord(call) && isRecord(call.function) && typeof call.function.arguments === "string" ? call.function.arguments : "";
      return { text: args, raw: { model: response.model, usage: response.usage } };
    },
  };
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= 6; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** (attempt - 1), 30000)));
    try {
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      if (res.ok) return (await res.json()) as Record<string, unknown>;
      const text = await res.text().catch(() => "");
      const error = new Error(`${url} returned ${res.status}: ${text.slice(0, 300)}`);
      if (res.status !== 429 && res.status < 500) throw error;
      lastError = error;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/returned 4\d\d/.test(message) && !message.includes("returned 429")) throw error;
      lastError = error instanceof Error ? error : new Error(message);
    }
  }
  throw lastError ?? new Error("Request failed.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
