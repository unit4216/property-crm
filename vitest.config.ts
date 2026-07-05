import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests only — pure logic in src/lib and elsewhere. Component and page
// tests that need a DB or a browser live in e2e/ under Playwright instead.
export default defineConfig({
  resolve: {
    alias: {
      // Mirror the "@/*" -> "./src/*" mapping from tsconfig.json so tests can
      // import modules the same way the app does.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      // Use istanbul, not the v8 default: v8 fails to instrument this repo's
      // pure type/function-only modules (no module-level side effects), so it
      // silently drops most of src/lib from the report.
      provider: "istanbul",
      // Unit tests own the pure-logic layer only; the rest of the app is
      // covered by Playwright e2e, so scope the denominator to src/lib to keep
      // the number meaningful.
      include: ["src/lib/**/*.ts"],
      exclude: ["**/*.test.ts"],
      reporter: ["text", "json-summary", "html"],
    },
  },
});
