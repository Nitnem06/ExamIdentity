# Deploying ExamIdentity (MVP)

This guide covers a minimal production/MVP deployment. SSO is intentionally out
of scope for the MVP — university/reviewer access uses a dev-token route gated
behind `ALLOW_DEV_TOKEN` (see below).

## Components

| Component | Stack | Required? |
|---|---|---|
| `apps/web` | Next.js | yes |
| `services/api` | Fastify (Node ≥ 20) | yes |
| Postgres | managed (Supabase / RDS / Neon) | yes |
| `services/scoring` | Python/FastAPI | optional (API has a local fallback) |
| `services/realtime` | Go | optional (not used by the MVP UI) |
| Redis | — | optional (in-memory used for MVP single instance) |

## 1. Database

Run, in order, against the production database:

1. `infrastructure/db/init.sql`
2. `infrastructure/db/migrations/010_identity.sql`
3. `infrastructure/db/seed.sql` — optional, but recommended for the MVP demo so
   `/transparency`, `/exam` (`sess-001`) and `/wallet/export/demo` (`cred-001`)
   show content.

```bash
psql "$DATABASE_URL" -f infrastructure/db/init.sql
psql "$DATABASE_URL" -f infrastructure/db/migrations/010_identity.sql
psql "$DATABASE_URL" -f infrastructure/db/seed.sql   # optional demo data
```

## 2. API service

Set the env vars from `services/api/.env.production.example` (generate real
secrets). Then:

```bash
pnpm install
pnpm --filter @examidentity/shared-types --filter @examidentity/crypto-utils build
pnpm --filter @examidentity/api build
NODE_ENV=production node services/api/dist/server.js
```

Key vars: `JWT_SECRET`, `PLATFORM_ENCRYPTION_KEY`, `PLATFORM_PRIVATE_KEY`,
`DATABASE_URL`, `FRONTEND_URL` (CORS), `PUBLIC_BASE_URL`, `K_ANONYMITY=5`.

**MVP staff access (no SSO):** set `ALLOW_DEV_TOKEN=true` and a `DEV_AUTH_SECRET`
so university/reviewer tokens can be minted via `POST /api/auth/dev-token` for
the demo. Remove `ALLOW_DEV_TOKEN` once real SSO is implemented.

## 3. Web app

Set the API URL at build time, then build/start:

```bash
NEXT_PUBLIC_API_URL=https://your-api.example.com pnpm --filter web build
pnpm --filter web start
```

`NEXT_PUBLIC_API_URL` is baked in at build time — it must point to the deployed
API, not localhost.

## 4. Smoke test after deploy

- `GET https://your-api.example.com/health` → `{ "status": "ok" }`
- Web: **Get started** → enroll → you're signed in; `/exam`, `/transparency`,
  `/wallet/export/demo` load.
- Staff demo: `POST /api/auth/dev-token` with `{ "role": "reviewer", "secret": "<DEV_AUTH_SECRET>" }`.

## Notes / known MVP limitations

- **Auth model:** self-custody. A student's key lives encrypted in their
  browser; logging in on a new device requires their recovery file.
- **SSO:** not implemented — staff access relies on `ALLOW_DEV_TOKEN` for the MVP.
- **DID/VC:** lightweight `did:key` + Ed25519 (not the full Veramo stack yet).
- **QR:** verification links are real; the QR image itself is a placeholder.
- **Scoring/realtime/Redis:** optional for the MVP.
