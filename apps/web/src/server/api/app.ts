import { Hono } from "hono";

import { services } from "../services";
import { onError } from "./errors";
import { principal } from "./principal";

export const app = new Hono()
  .basePath("/api/v1")
  .use(principal)
  .onError(onError)
  .get("/notes", async (c) => {
    const { notes } = await services();
    return c.json({ data: await notes.list(c.var.principal) });
  })
  .post("/notes", async (c) => {
    const { notes } = await services();
    const body: unknown = await c.req.json().catch(() => undefined);
    return c.json(await notes.create(c.var.principal, body), 201);
  })
  .get("/notes/:id", async (c) => {
    const { notes } = await services();
    return c.json(await notes.get(c.var.principal, c.req.param("id")));
  });
