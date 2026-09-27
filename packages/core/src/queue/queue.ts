import type { JobName, Jobs } from "./jobs.ts";

export interface Job<N extends JobName> {
  id: string;
  name: N;
  data: Jobs[N];
}

/** Sends background jobs. */
export interface JobQueue {
  send<N extends JobName>(name: N, data: Jobs[N]): Promise<void>;
}

/** Sends and consumes background jobs. */
export interface JobWorker extends JobQueue {
  work<N extends JobName>(name: N, handler: (job: Job<N>) => Promise<void>): Promise<void>;
  stop(): Promise<void>;
}
