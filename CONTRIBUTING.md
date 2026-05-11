# Contributing to Bus-Booking-System

Thanks for your interest! This repo is a small full-stack demo so the bar is
"be useful and don't break the build". Anything beyond that is a bonus.

## Project layout

```
client/   React 18 + Vite + Tailwind SPA
server/   Express + better-sqlite3 + zod API
e2e/      Playwright smoke tests
scripts/  Build/CI helpers
docker-compose.yml + per-service Dockerfiles
```

## Getting started

```bash
npm run install:all   # install root, server, and client deps
npm run seed          # populate the SQLite DB with demo data
npm run dev           # server on :3001, client on :5173
```

### Run via Docker

```bash
docker compose up --build
# client → http://localhost:8080
# server is internal-only; talk to it through /api/* on the client host
```

## Running checks before you push

Every PR should be green on these locally:

| Check                | Command                                           |
| -------------------- | ------------------------------------------------- |
| Server build         | `cd server && npm run build`                      |
| Server tests         | `cd server && npm test`                           |
| Client build         | `cd client && npm run build`                      |
| Bundle-size budget   | `cd client && node ../scripts/check-bundle-size.mjs` |
| E2E smoke (optional) | `npm run e2e` (needs `npm run e2e:install` once)  |

The same set runs in GitHub Actions on every push and PR.

## Commit conventions

Use Conventional Commits — keeps the git log greppable and lets
the changelog (when we add one) generate itself:

```
feat(client): add filter sidebar on SearchResults
fix(server): cast COUNT(*) result row in seed.ts
docs(readme): document promo codes
test(e2e): add 404 page smoke test
chore(deps): bump express to 4.21.1
```

Scopes we use: `server`, `client`, `e2e`, `ci`, `docker`, `deps`, `readme`.

## Coding style

- TypeScript strict on both server and client.
- Tailwind utilities first; reach for a CSS class only when a pattern repeats.
- Components live under `client/src/components`. Pages live under `client/src/pages`.
- Server routes go in `server/src/routes/<feature>.ts` and are wired into
  `server/src/app.ts`. Always validate input with zod before touching the DB.
- New tables go in `server/src/db/index.ts` inside `initDB()` so they get
  created idempotently on boot.
- Run Prettier (configured in both packages) before committing.

## What not to do

- Don't add real payment processing (Stripe etc.). The demo deliberately
  stops at "create booking" without charging anyone.
- Don't commit secrets, `.env`, or files in `server/data/`.
- Don't bypass the validation/auth middleware on protected routes.

## Reporting bugs / requesting features

Open an issue with:
- What you expected to happen
- What actually happened
- Minimal repro steps
- Browser + Node version if relevant
