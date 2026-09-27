import type { Principal } from "@app/core/auth";
import { createMiddleware } from "hono/factory";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolves the caller into a `Principal`, or responds 401. */
export const principal = createMiddleware<{ Variables: { principal: Principal } }>(
  async (c, next) => {
    // TODO: replace with real authentication. Outside production, the caller is the UUID in `x-user-id`.
    const userId = process.env.NODE_ENV === "production" ? undefined : c.req.header("x-user-id");
    if (!userId || !uuidPattern.test(userId)) {
      return c.json({ title: "Unauthenticated", status: 401 }, 401, {
        "content-type": "application/problem+json",
      });
    }
    c.set("principal", { userId });
    await next();
  },
);
