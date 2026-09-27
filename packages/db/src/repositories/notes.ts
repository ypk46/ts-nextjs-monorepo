import type { NotesRepo } from "@app/core/notes";
import { and, desc, eq } from "drizzle-orm";

import type { Db } from "../client.ts";
import { notes } from "../schema.ts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function notesRepo(db: Db, userId: string): NotesRepo {
  return {
    list() {
      return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
    },

    async get(id) {
      // A malformed ID can't match any row; skip the query Postgres would reject.
      if (!uuidPattern.test(id)) return undefined;
      const [row] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, id), eq(notes.userId, userId)));
      return row;
    },

    async create(input) {
      const [row] = await db
        .insert(notes)
        .values({ ...input, userId })
        .returning();
      return row;
    },
  };
}
