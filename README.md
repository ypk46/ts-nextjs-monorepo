# ts-nextjs-monorepo

A starter for projects shaped like **web + API + worker + core + DB**: Next.js with a Hono API,
a pg-boss background worker, a framework-free domain package and Drizzle on Postgres. Lint,
typecheck, formatting, dependency-direction rules and CI come preconfigured.

## Layout

A pnpm + Turborepo monorepo:

| Path            | What                                                                  |
| --------------- | --------------------------------------------------------------------- |
| `apps/web`      | Next.js app: UI, `GET /api/health`, Hono API at `/api/v1`             |
| `apps/worker`   | pg-boss worker, runs TypeScript directly on Node 24                   |
| `packages/core` | Domain services, ports, adapters (pg-boss), domain errors, env config |
| `packages/db`   | Drizzle schema, migrations, user-scoped repositories                  |
| `docs/`         | PRD and technical design skeletons                                    |

Dependency direction, enforced by ESLint: `core` ← `db` ← (`web`, `worker`).

The `notes` feature is a working example of every layer: a table, a scoped repository, a service,
API routes, a `note.created` job and a worker handler.

## Requirements

- Node.js 24 (`.nvmrc`)
- pnpm 10
- Docker

## Starting a new project

```sh
cp -r ts-nextjs-monorepo my-project && cd my-project
rm -rf .git && git init -b main
scripts/rename.sh my-project   # @app/* → @my-project/*, DB user/name → my_project / my_project_db
```

Then replace the example:

1. Write `docs/PRD.md` and `docs/TECHNICAL_DESIGN.md`.
2. Delete the notes example: `packages/core/src/notes`, `packages/db/src/repositories/notes.ts`,
   `loadNote` in `packages/db/src/internal.ts`, the `notes` table in `packages/db/src/schema.ts`,
   the routes in `apps/web/src/server/api/app.ts`, the `note.created` job in
   `packages/core/src/queue/jobs.ts` and its handler in `apps/worker/src/main.ts`.
3. Regenerate migrations: delete `packages/db/migrations/` and run `pnpm --filter <scope>/db db:generate`.
4. Replace the `x-user-id` auth stub in `apps/web/src/server/api/principal.ts`.

## Run locally

```sh
cp apps/web/.env.example apps/web/.env
cp apps/worker/.env.example apps/worker/.env
cp packages/db/.env.example packages/db/.env
docker compose up -d   # Postgres 17 on localhost:5432 (user/password: app, db: app_db)
pnpm install
pnpm db:migrate
pnpm dev               # web on http://localhost:3000 + worker
```

If port 5432 is taken (for example by another project's database), run
`POSTGRES_PORT=5433 docker compose up -d` and use port 5433 in the `.env` files.

Try it:

```sh
curl localhost:3000/api/health   # {"status":"ok","db":"ok"}

U=11111111-1111-4111-8111-111111111111
curl -X POST localhost:3000/api/v1/notes -H "x-user-id: $U" \
  -H 'content-type: application/json' -d '{"title":"hello"}'   # 201; the worker logs note.created
curl localhost:3000/api/v1/notes -H "x-user-id: $U"             # your notes only
```

Another user's note returns 404; a request without `x-user-id` returns 401.

Production build: `pnpm build && pnpm start`.

Checks: `pnpm format:check`, `pnpm lint` (ESLint, including the dependency-direction rules) and
`pnpm typecheck`. CI runs all three.
