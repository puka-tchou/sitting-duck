import eslint from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

const config = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
    },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      sourceType: "module",
      globals: { turf: true, console: true },
    },
  },
);

config.push({
  plugins: ["jest"],
  ignores: [
    "__tests__/",
    "_test/",
    "_types/",
    "build/",
    "node_modules/",
    "package-lock.json",
    "package.json",
  ],
  env: {
    "jest/globals": true,
  },
});

export default config;
