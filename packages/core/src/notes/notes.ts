import { z } from "zod";

import type { Principal } from "../auth/index.ts";
import { NotFoundError, ValidationError } from "../errors.ts";
import type { JobQueue } from "../queue/index.ts";

export const createNoteInput = z.object({
  title: z.string().trim().min(1).max(200),
});

export type CreateNoteInput = z.infer<typeof createNoteInput>;

export interface Note {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
}

/** Note storage scoped to one user. Implementations only see that user's rows. */
export interface NotesRepo {
  list(): Promise<Note[]>;
  get(id: string): Promise<Note | undefined>;
  create(input: CreateNoteInput): Promise<Note>;
}

export interface NotesDeps {
  notesFor: (userId: string) => NotesRepo;
  queue: JobQueue;
}

export function createNotesService({ notesFor, queue }: NotesDeps) {
  return {
    list(principal: Principal): Promise<Note[]> {
      return notesFor(principal.userId).list();
    },

    /** Throws `NotFoundError` for missing notes and for notes owned by another user. */
    async get(principal: Principal, id: string): Promise<Note> {
      const note = await notesFor(principal.userId).get(id);
      if (!note) throw new NotFoundError("Note");
      return note;
    },

    /** Throws `ValidationError` if `input` doesn't match `createNoteInput`. */
    async create(principal: Principal, input: unknown): Promise<Note> {
      const parsed = createNoteInput.safeParse(input);
      if (!parsed.success) throw new ValidationError(z.prettifyError(parsed.error));
      const note = await notesFor(principal.userId).create(parsed.data);
      await queue.send("note.created", { noteId: note.id });
      return note;
    },
  };
}

export type NotesService = ReturnType<typeof createNotesService>;
