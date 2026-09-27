import { parseEnv, webEnv, type WebEnv } from "@app/core/config";

let cached: WebEnv | undefined;

/** Validated web config. Throws `InvalidEnvError` if the environment is invalid. */
export function env(): WebEnv {
  cached ??= parseEnv(webEnv, "web");
  return cached;
}
