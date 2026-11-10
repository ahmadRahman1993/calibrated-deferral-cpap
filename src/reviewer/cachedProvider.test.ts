import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Provider } from "reliability-eval";
import { describe, expect, it } from "vitest";
import { cachedProvider, promptHash, replayProvider, ResponseCache } from "./cachedProvider.js";
import { sampleOutput } from "./schema.js";

describe("cached provider", () => {
  it("passes temperature 0 and does not call the model again for the same prompt", async () => {
    const calls: Array<{ temperature?: number; maxTokens?: number }> = [];
    const base: Provider = {
      name: "fake",
      model: "tiny",
      async generate(_prompt, opts) {
        calls.push({ temperature: opts?.temperature, maxTokens: opts?.maxTokens });
        return { text: JSON.stringify(sampleOutput("REFER")), raw: { ok: true } };
      },
    };
    const dir = mkdtempSync(path.join(tmpdir(), "cpap-cache-"));
    const cache = new ResponseCache(path.join(dir, "responses.jsonl"));
    const prompt = "review this case";
    const provider = cachedProvider(base, cache, {
      variant: "A",
      caseIdByHash: new Map([[promptHash("tiny", prompt), "case-0001"]]),
    });
    await provider.generate(prompt);
    await provider.generate(prompt);
    expect(calls).toEqual([{ temperature: 0, maxTokens: 1500 }]);
    const reloaded = new ResponseCache(path.join(dir, "responses.jsonl"));
    reloaded.load();
    const replay = replayProvider(reloaded, "tiny", "replay");
    const again = await replay.generate(prompt);
    expect(again.text).toContain("REFER");
    await expect(replay.generate("a different prompt")).rejects.toThrow(/Cache miss/);
  });
});
