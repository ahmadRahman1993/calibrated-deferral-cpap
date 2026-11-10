import { describe, expect, it } from "vitest";
import { findForbiddenLines } from "./neverDeny.js";

describe("decision vocabulary", () => {
  it("keeps the forbidden decision word inside the never-deny disclaimer", () => {
    expect(findForbiddenLines(process.cwd())).toEqual([]);
  });
});
