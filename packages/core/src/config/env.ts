import { z } from "zod";

const databaseUrl = z.url({
  protocol: /^postgres(ql)?$/,
  error: "must be a postgres:// or postgresql:// URL",
});

/** Env required to connect to Postgres. */
export const dbEnv = z.object({
  DATABASE_URL: databaseUrl,
});

/** Env for the web process. */
export const webEnv = dbEnv.extend({});

/** Env for the worker process. */
export const workerEnv = dbEnv.extend({});

export type DbEnv = z.infer<typeof dbEnv>;
export type WebEnv = z.infer<typeof webEnv>;
export type WorkerEnv = z.infer<typeof workerEnv>;

export class InvalidEnvError extends Error {
  constructor(processName: string, details: string) {
    super(`Invalid ${processName} environment:\n${details}`);
    this.name = "InvalidEnvError";
  }
}

/**
 * Parses `source` against `schema`. Throws `InvalidEnvError` naming the invalid
 * variables without echoing their values.
 */
export function parseEnv<S extends z.ZodType>(
  schema: S,
  processName: string,
  source: Record<string, string | undefined> = process.env,
): z.infer<S> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new InvalidEnvError(processName, z.prettifyError(result.error));
  }
  return result.data;
}
