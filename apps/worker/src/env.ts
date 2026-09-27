import { parseEnv, workerEnv, type WorkerEnv } from "@app/core/config";

let cached: WorkerEnv | undefined;

/** Validated worker config. Throws `InvalidEnvError` if the environment is invalid. */
export function env(): WorkerEnv {
  cached ??= parseEnv(workerEnv, "worker");
  return cached;
}
