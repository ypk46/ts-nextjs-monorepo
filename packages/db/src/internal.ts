// Unscoped loaders for trusted processes (the worker). Never import these from request handlers.
import type { Note } from "@app/core/notes";
import { eq } from "drizzle-orm";

import type { Db } from "./client.ts";
import { notes } from "./schema.ts";

export async function loadNote(db: Db, id: string): Promise<Note | undefined> {
  const [row] = await db.select().from(notes).where(eq(notes.id, id));
  return row;
}
