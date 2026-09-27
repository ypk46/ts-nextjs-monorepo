/** Job names and their payloads. Payloads carry IDs only; consumers reload state from the DB. */
export interface Jobs {
  "note.created": { noteId: string };
}

export type JobName = keyof Jobs;

export const jobNames = ["note.created"] as const satisfies readonly JobName[];
