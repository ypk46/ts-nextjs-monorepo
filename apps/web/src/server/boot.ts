import { env } from "./env";

try {
  env();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
