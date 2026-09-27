import { createDb, type Db } from "@app/db";

import { env } from "./env";

// Reuse one pool across dev hot reloads.
const globalForDb = globalThis as unknown as { appDb?: Db };

export function db(): Db {
  globalForDb.appDb ??= createDb(env().DATABASE_URL);
  return globalForDb.appDb;
}
