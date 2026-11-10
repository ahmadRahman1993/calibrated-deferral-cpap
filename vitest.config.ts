import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["policy/**/*.test.ts", "src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
