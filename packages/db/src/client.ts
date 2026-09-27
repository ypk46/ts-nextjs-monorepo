import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import * as schema from "./schema.ts";

export type Db = PostgresJsDatabase<typeof schema> & { $client: Sql };

export interface DbOptions {
  /** Pool size. Defaults to the driver's default (10). */
  max?: number;
  /** Seconds to wait for a connection before failing. */
  connectTimeout?: number;
}

export function createDb(url: string, options: DbOptions = {}): Db {
  const client = postgres(url, {
    max: options.max,
    connect_timeout: options.connectTimeout ?? 5,
    onnotice: () => {},
  });
  return drizzle(client, { schema });
}

/** Round-trips `select 1`. Rejects if the database is unreachable. */
export async function ping(db: Db): Promise<void> {
  await db.execute(sql`select 1`);
}

/** Closes the connection pool, waiting for running queries to finish. */
export async function closeDb(db: Db): Promise<void> {
  await db.$client.end();
}
