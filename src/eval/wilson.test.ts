import { describe, expect, it } from "vitest";
import { wilsonUpper } from "./wilson.js";

describe("wilsonUpper", () => {
  it("puts the 95% upper bound for 0 errors in 100 approvals near 3.7%", () => {
    const upper = wilsonUpper(0, 100);
    expect(upper).not.toBeNull();
    expect(upper!).toBeGreaterThan(0.036);
    expect(upper!).toBeLessThan(0.038);
  });

  it("returns null when nothing was auto-approved", () => {
    expect(wilsonUpper(0, 0)).toBeNull();
  });

  it("rises when errors are observed", () => {
    const clean = wilsonUpper(0, 100)!;
    const dirty = wilsonUpper(5, 100)!;
    expect(dirty).toBeGreaterThan(clean);
  });
});
