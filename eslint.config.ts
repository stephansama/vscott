import astro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import { configs } from "typescript-eslint";

export default defineConfig(
  globalIgnores(["dist/**", ".astro/**", "node_modules/**", "public/**"]),
  ...configs.recommended,
  ...astro.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
);
