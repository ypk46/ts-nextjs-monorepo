import { ping } from "@app/db";

import { db } from "../../../server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ping(db());
    return Response.json({ status: "ok", db: "ok" });
  } catch {
    return Response.json({ status: "degraded", db: "error" }, { status: 503 });
  }
}
