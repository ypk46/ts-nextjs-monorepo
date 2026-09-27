import { NotFoundError, ValidationError } from "@app/core/errors";
import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

function problem(status: ContentfulStatusCode, title: string, detail?: string) {
  return { body: { title, status, ...(detail && { detail }) }, status };
}

/** Maps domain errors to problem+json responses. */
export const onError: ErrorHandler = (error, c) => {
  const { body, status } =
    error instanceof NotFoundError
      ? problem(404, "Not found", error.message)
      : error instanceof ValidationError
        ? problem(400, "Invalid request", error.message)
        : problem(500, "Internal server error");
  if (status === 500) console.error(error);
  return c.json(body, status, { "content-type": "application/problem+json" });
};
