import type { Db } from "../client.ts";
import { notesRepo } from "./notes.ts";

/** Repositories scoped to one user. Rows owned by other users are invisible. */
export function forUser(db: Db, userId: string) {
  return {
    notes: notesRepo(db, userId),
  };
}
