import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const frameworkImports = [
  {
    group: ["next", "next/*", "@next/*", "hono", "hono/*", "@hono/*"],
    message: "Keep this package framework-free.",
  },
];

const uiImports = [
  {
    group: ["react", "react/*", "react-dom", "react-dom/*"],
    message: "Core has no UI; React belongs in web.",
  },
];

export default defineConfig([
  globalIgnores([
    "**/node_modules/",
    "**/.next/",
    "**/.turbo/",
    "**/dist/",
    "**/next-env.d.ts",
    "packages/db/migrations/",
  ]),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    extends: [nextPlugin.configs["core-web-vitals"], reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    settings: { next: { rootDir: `${import.meta.dirname}/apps/web` } },
  },
  // Workspace dependency direction: core <- db <- (web, worker).
  {
    plugins: { boundaries },
    settings: {
      "boundaries/root-path": import.meta.dirname,
      "import/resolver": {
        typescript: {
          noWarnOnMultipleProjects: true,
          project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json"],
        },
      },
      "boundaries/elements": [
        { type: "web", pattern: "apps/web", partialMatch: false },
        { type: "worker", pattern: "apps/worker", partialMatch: false },
        { type: "db", pattern: "packages/db", partialMatch: false },
        { type: "core", pattern: "packages/core", partialMatch: false },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message: "{{from.type}} must not import {{to.type}}.",
          policies: [
            {
              from: { element: { type: "db" } },
              allow: { to: { element: { type: "core" } } },
            },
            {
              from: { element: { type: ["web", "worker"] } },
              allow: { to: { element: { type: ["db", "core"] } } },
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/core/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [...frameworkImports, ...uiImports] }],
    },
  },
]);
