import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Example owned table. Every owned table has a `user_id`.
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notes_user_id_idx").on(t.userId)],
);
