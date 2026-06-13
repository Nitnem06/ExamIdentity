# Deploying Provora (MVP)

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

If you do not have psql, run the same SQL files manually in the Supabase SQL Editor.

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

For the web app, we'll use Vercel (it's free for this project and easy to deploy).

1. First, let's set up the environment variables for the API service since that's the
Backend infrastructure:

- Create services/api/.env.production:

    
    bash
    JWT_SECRET=some-base64-secret-here  # e.g. 32 bytes, use openssl rand -base64 32
    # (The same value as in .env.development for now)
    DATABASE_URL=postgresql://postgres:[EMAIL_ADDRESS]/postgres
    # Your Supabase connection string
    PLATFORM_ENCRYPTION_KEY=...  # from .env.development
    PLATFORM_PRIVATE_KEY=...    # from .env.development
    FRONTEND_URL=https://examidentity.vercel.app
    PUBLIC_BASE_URL=https://your-api.onrender.com
    K_ANONYMITY=5
    ALLOW_DEV_TOKEN=true  # for MVP-only staff access
    DEV_AUTH_SECRET=<generate-a-secret>


    2. Then, rebuild the API (which will bundle crypto-utils and shared-types):

    bash
    pnpm install
    pnpm --filter @examidentity/shared-types --filter @examidentity/crypto-utils build
    pnpm --filter @examidentity/api build


    3. Now deploy the API to Render (create a "Web Service" from your repo):

    * Region: choose the one closest to your users (e.g., N. Virginia).
    * Branch: main.
    * Start command: NODE_ENV=production node services/api/dist/server.js.
    * Set all the environment variables above in the Render UI using the values you prepared.
    * Save — Render will build and deploy.


2. Deploy the web app to Vercel
    Import the same repo into Vercel.

- Root directory
  - apps/web
- Framework
  - Next.js
- Required frontend environment variable
NEXT_PUBLIC_API_URL=https://your-api-service.onrender.com
NEXT_PUBLIC_API_URL is baked in at build time. If you change it, redeploy the frontend.

  

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


## 3. Web app

1.Deploy the web app to Vercel
    Import the same repo into Vercel.

Root directory
bash
apps/web
Framework
Next.js
Required frontend environment variable
bash
NEXT_PUBLIC_API_URL=https://your-api-service.onrender.com
NEXT_PUBLIC_API_URL is baked in at build time. If you change it, redeploy the frontend.



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
