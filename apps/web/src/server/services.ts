import { createNotesService, type NotesService } from "@app/core/notes";
import { createPgBossQueue } from "@app/core/queue";
import { forUser } from "@app/db";

import { db } from "./db";
import { env } from "./env";

export interface Services {
  notes: NotesService;
}

// Reuse one set of services (and one pg-boss connection) across dev hot reloads.
const globalForServices = globalThis as unknown as { appServices?: Promise<Services> };

async function build(): Promise<Services> {
  const queue = await createPgBossQueue(env().DATABASE_URL);
  return {
    notes: createNotesService({ notesFor: (userId) => forUser(db(), userId).notes, queue }),
  };
}

export function services(): Promise<Services> {
  globalForServices.appServices ??= build().catch((error: unknown) => {
    globalForServices.appServices = undefined;
    throw error;
  });
  return globalForServices.appServices;
}
