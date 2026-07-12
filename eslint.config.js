import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/", "dist/", "coverage/"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-undef": "error",
      "no-useless-escape": "warn",
      "no-useless-assignment": "off",
    },
  },
  {
    files: ["src/scripts/**/*.js"],
    rules: {
      "no-unused-vars": "off",
    },
  },
];
