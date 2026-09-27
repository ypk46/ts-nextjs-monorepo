import { PgBoss } from "pg-boss";

import { jobNames, type JobName, type Jobs } from "./jobs.ts";
import type { JobQueue, JobWorker } from "./queue.ts";

async function startBoss(url: string, mode: "send" | "work"): Promise<PgBoss> {
  // Only the worker runs maintenance and cron scheduling.
  const boss = new PgBoss(
    mode === "send"
      ? { connectionString: url, supervise: false, schedule: false }
      : { connectionString: url },
  );
  boss.on("error", (error) => console.error("pg-boss error", error));
  await boss.start();
  // Idempotent: existing queues are left unchanged.
  for (const name of jobNames) await boss.createQueue(name);
  return boss;
}

function sender(boss: PgBoss): JobQueue {
  return {
    async send<N extends JobName>(name: N, data: Jobs[N]) {
      await boss.send(name, data);
    },
  };
}

/** A send-only queue for processes that enqueue jobs but don't consume them. */
export async function createPgBossQueue(url: string): Promise<JobQueue> {
  return sender(await startBoss(url, "send"));
}

/** A queue that also consumes jobs, one at a time per registered handler. */
export async function createPgBossWorker(url: string): Promise<JobWorker> {
  const boss = await startBoss(url, "work");
  return {
    ...sender(boss),
    async work(name, handler) {
      await boss.work<Jobs[typeof name]>(name, async ([job]) => {
        if (job) await handler({ id: job.id, name, data: job.data });
      });
    },
    async stop() {
      await boss.stop({ graceful: true });
    },
  };
}
