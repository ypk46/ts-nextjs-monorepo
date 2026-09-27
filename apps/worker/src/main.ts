import { createPgBossWorker } from "@app/core/queue";
import { closeDb, createDb } from "@app/db";
import { loadNote } from "@app/db/internal";

import { env } from "./env.ts";

let config;
try {
  config = env();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const db = createDb(config.DATABASE_URL);
const worker = await createPgBossWorker(config.DATABASE_URL);

await worker.work("note.created", async ({ data }) => {
  const note = await loadNote(db, data.noteId);
  if (!note) {
    console.warn(`note.created: note ${data.noteId} no longer exists`);
    return;
  }
  console.log(`note.created: "${note.title}" (${note.id})`);
});

console.log("worker started");

async function shutdown(signal: string) {
  console.log(`${signal} received, stopping worker`);
  await worker.stop();
  await closeDb(db);
  process.exit(0);
}

process.once("SIGINT", (signal) => void shutdown(signal));
process.once("SIGTERM", (signal) => void shutdown(signal));
