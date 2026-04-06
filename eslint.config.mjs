import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            'JSXAttribute[name.name="style"] Property Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message:
            "Use a theme token (var(--color-*)) instead of a hardcoded hex color. See src/themes/types.ts for available tokens.",
        },
      ],
    },
  },
]);

export default eslintConfig;
