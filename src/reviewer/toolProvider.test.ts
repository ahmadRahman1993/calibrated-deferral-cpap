import { afterEach, describe, expect, it } from "vitest";
import { sampleOutput } from "./schema.js";
import { REVIEW_TOOL_NAME, toolProvider } from "./toolProvider.js";

describe("tool provider", () => {
  const original = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = original;
  });

  it("sends a forced tool choice and returns the tool input as JSON", async () => {
    let body: Record<string, unknown> = {};
    globalThis.fetch = async (_url, init) => {
      body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          content: [{ type: "tool_use", name: REVIEW_TOOL_NAME, input: sampleOutput("REFER") }],
        }),
        { status: 200 },
      );
    };
    const provider = toolProvider({ model: "tiny", temperature: 0, provider: "anthropic" });
    const response = await provider.generate("review this");
    expect(body.tool_choice).toEqual({ type: "tool", name: REVIEW_TOOL_NAME });
    expect(JSON.parse(response.text).decision).toBe("REFER");
  });
});
