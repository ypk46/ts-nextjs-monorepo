import { existsSync } from "node:fs";

import { dbEnv, parseEnv } from "@app/core/config";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't load .env itself. Existing process env takes precedence.
if (existsSync(".env")) process.loadEnvFile(".env");

const env = parseEnv(dbEnv, "migrations");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: { url: env.DATABASE_URL },
  strict: true,
  verbose: true,
});
