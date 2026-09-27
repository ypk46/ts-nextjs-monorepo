# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A TypeScript monorepo: Next.js (UI + Hono API) and a pg-boss worker on top of a framework-free
`core` and a Drizzle `db` package. `docs/PRD.md` holds the product requirements and
`docs/TECHNICAL_DESIGN.md` holds the design. Decisions there are cited by ID (e.g. ADR `D2`,
requirement `AUTH-1`). When code and the design disagree, raise it rather than silently diverging.

## Commands

Node 24, pnpm 10, Docker.

```sh
cp apps/web/.env.example apps/web/.env          # once per package that has an .env.example
cp apps/worker/.env.example apps/worker/.env
cp packages/db/.env.example packages/db/.env
docker compose up -d   # Postgres 17 on localhost:${POSTGRES_PORT:-5432} (user/password: app, db: app_db)
pnpm install
pnpm db:migrate        # turbo → drizzle-kit migrate in packages/db
pnpm dev               # turbo run dev → web on :3000 + worker
pnpm build             # turbo run build
pnpm start             # production web + worker (runs build first)
pnpm lint              # turbo → eslint in every package
pnpm typecheck         # turbo → tsc --noEmit in every package
pnpm format            # oxfmt --write over the whole repo (root, not turbo)
pnpm format:check      # oxfmt --check; CI fails on unformatted files
pnpm --filter @app/web <script>   # run a script in one package
```

Env files live in each package that runs a process, never at the root, and hold only the
variables that process's schema in `packages/core/src/config` declares. Next.js loads
`apps/web/.env*`; the worker loads `apps/worker/.env` (`node --env-file-if-exists`);
`drizzle.config.ts` loads `packages/db/.env`. Variables already set in the shell win. Production
sets real env vars and has no `.env` files; because turbo runs in strict env mode, any var a turbo
task needs from the shell must be listed in its `passThroughEnv`. Web and worker exit at boot if
their env is invalid. Schema changes: edit `packages/db/src/schema.ts`, then
`pnpm --filter @app/db db:generate` and review the SQL.

The worker runs its TypeScript directly on Node's type stripping (no build step), so every
package it loads must use erasable syntax only (no enums, namespaces or parameter properties).
`tsconfig.base.json` enforces this with `erasableSyntaxOnly`.

`pnpm lint` runs ESLint (one root `eslint.config.mjs`, flat config, type-aware) in every package. It
enforces the dependency direction with `eslint-plugin-boundaries`, plus the framework and UI
import bans on `core`. `pnpm typecheck` runs `tsc --noEmit` per package. TypeScript is pinned to
`~6.0` everywhere because typescript-eslint doesn't support TS 7, which has no JS API. Upgrade once
typescript-eslint supports TS 7.1+. Typed lint only sees files in the package's `tsconfig.json`
`include` (root `*.ts` config files included), so a new package's tsconfig must cover every `.ts`
file in it. There are no test scripts yet.
Formatting is oxfmt (root `.oxfmtrc.json`, defaults plus ignoring drizzle migrations), pinned exact
because it's pre-1.0. ESLint has no stylistic rules, so the two don't conflict. CI
(`.github/workflows/ci.yml`) runs `format:check`, `lint` and `typecheck`.
Health check: `GET /api/health` → `{"status":"ok","db":"ok"}`
(503 `{"status":"degraded","db":"error"}` when Postgres is unreachable).

## Structure

pnpm workspaces + Turborepo (`apps/*`, `packages/*`). Workspace packages export TypeScript source
(`.ts` imports), transpiled by Next via `transpilePackages` and run directly by the worker:

- `apps/web`: Next.js 16 App Router, source under `src/`. `src/server/api` is the Hono app mounted
  at `/api/v1` (`src/app/api/v1/[[...route]]/route.ts`); `src/server/services.ts` wires `db` repos
  and the queue into `core` services.
- `apps/worker`: background worker. It consumes pg-boss jobs and serves no HTTP.
- `packages/core`: framework-free domain services, ports (repository interfaces, `JobQueue`),
  adapters (pg-boss), domain errors and zod env config.
- `packages/db`: Drizzle schema, migrations, user-scoped repositories (`forUser(db, userId)`) and
  unscoped loaders for the worker (`@app/db/internal`). No business rules.

The `notes` feature is a working example of every layer (table → repo → service → API → job →
worker). Replace it when starting a real project.

## Code comments

- Comments and docstrings are concise and directly describe what the code does.
- Never reference `docs/PRD.md` or `docs/TECHNICAL_DESIGN.md` in code (no `§6.5`, ADR or requirement IDs).
  Cite them in PR descriptions instead.
- Don't describe planned or future behavior except in a `TODO:` comment.

## Design rules to respect

- **Dependency direction:** `core` ← `db` ← (`web`, `worker`). `core` never imports Next.js, Hono,
  React or `db`; it declares repository ports that `db` implements.
- **One service layer:** API handlers are thin adapters (authenticate → `Principal` → `core` service → map result).
  Services validate their own input with zod, so every caller (API, worker, a future MCP server)
  gets the same checks. The UI goes through `/api/v1` and never uses server actions that bypass it.
- **Domain errors map to HTTP in one place** (`apps/web/src/server/api/errors.ts`, problem+json).
- **Queue is pg-boss on Postgres** (no Redis). Job payloads carry only IDs. The worker reloads state
  from the DB and makes its own decisions from it. Add jobs to `packages/core/src/queue/jobs.ts`.
- **Isolation:** every owned table has `user_id`. Request-path queries go through scoped
  repositories (`forUser(db, userId)`). A foreign ID returns 404. Unscoped loaders live only in
  `@app/db/internal` and are for the worker.
- **Auth is a stub:** the `principal` middleware trusts an `x-user-id` header outside production
  and rejects everything in production. Replace it before shipping.
- **Local dev uses fakes** for external APIs (e.g. `EMAIL_PROVIDER=fake`). Only Postgres runs in Docker.
- **Migrations are expand/contract**, because web and worker deploy independently.
