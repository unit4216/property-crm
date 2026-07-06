import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow omitting a field via object rest (e.g. `const { key, ...rest }`)
      // without flagging the pulled-out sibling as unused.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { ignoreRestSiblings: true },
      ],
      // Nested ternaries are hard to read — use flat control flow or a helper.
      "no-nested-ternary": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
