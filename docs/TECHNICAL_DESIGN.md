# Technical design

## 1. Constraints and goals

## 2. Architecture

Next.js (UI + Hono API at `/api/v1`) and a pg-boss worker share one Postgres and the
`core`/`db` packages. See `CLAUDE.md` for the rules the code follows.

## 3. Data model

## 4. API

## 5. Background jobs

| Job | Payload | Producer → consumer | Options |
| --- | ------- | ------------------- | ------- |

## 6. Security

## 7. Operations (deploy, config, observability)

## 8. Testing

## 9. Decisions

Number decisions (`D1`, `D2`, …) so PRs can cite them.

| ID  | Decision | Why |
| --- | -------- | --- |
