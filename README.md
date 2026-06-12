# Provora

**Verifiable exam integrity without the black box.**

Provora is a privacy-first exam proctoring and credentialing platform. Every integrity decision it makes is explainable, disputable, and publicly auditable — and the credential a student earns is theirs to take anywhere.

---

## The Problem We Are Solving

Online proctoring today is broken in four ways:

1. **Black-box flagging.** Students get told "suspicious activity detected" with no explanation of what was observed, how it was measured, or why it crossed a line. There is no meaningful way to contest it.
2. **One-size-fits-all thresholds.** Students with accommodations (screen readers, motor or attention conditions) are flagged at far higher rates because systems compare them against a single global baseline instead of their own.
3. **Zero accountability.** Institutions and the public have no visibility into how often a proctoring system flags people, how often those flags are wrong, or whether evidence is actually deleted when it should be.
4. **Locked-in credentials.** Exam results live inside a vendor's portal. They cannot be independently verified, shared, or carried to another platform.

## What Makes Provora Unique

- **Explainable flags, not verdicts.** Every flag carries the observed value, the student's *personal* baseline, the policy threshold, any accommodation adjustment, the model's confidence, and the student's dispute rights. The explanation builder is deterministic and rule-based — not a black box.
- **Accommodation-aware scoring.** Policy thresholds are adjusted per accommodation (e.g. a screen-reader accommodation relaxes the off-screen gaze threshold 3×), so accessibility needs are not punished as cheating.
- **A cryptographic transparency log.** Issued credentials and key events are committed to an append-only, hash-chained Merkle log (RFC 6962 domain separation), so tampering is detectable by anyone.
- **Portable, self-owned credentials.** Students hold a DID and receive W3C Verifiable Credentials signed with Ed25519 — exportable as VC JSON, signed Verifiable Presentations, JWTs, QR verification links, LinkedIn shares, and wallet passes.
- **Privacy by design.** Public metrics are k-anonymized (counts below 5 suppressed), Category B evidence is auto-deleted after its 90-day retention window, and no DIDs or raw evidence ever reach a public surface.

---

## Top 3 Features

### 1. Explainable Flag Cards
Replaces vague "suspicious activity detected" messages with evidence-backed cards. Every flag shows **what** was observed (with the measured value), **how** it compares to the student's personal baseline and the policy threshold, **whether** an accommodation adjusted that threshold, the model's **confidence**, and **what happens next** — including the student's right to dispute. The builder is deterministic and rule-based, so the same inputs always produce the same explanation. *(See [`docs/explainable-flag-cards.md`](docs/explainable-flag-cards.md))*

### 2. Cross-Platform Credential Bridge
Proves credentials are truly **portable**. A student can export their integrity credential as W3C Verifiable Credential JSON, an Ed25519-signed Verifiable Presentation, a compact signed JWT, or a short-lived QR verification link — plus share it to LinkedIn or add it to Apple/Google Wallet (demo stubs pending issuer certificates). Verifiers confirm authenticity without contacting the platform. *(See [`docs/cross-platform-credential-bridge.md`](docs/cross-platform-credential-bridge.md))*

### 3. Public Transparency Dashboard
Holds the platform itself accountable. Fully anonymized metrics — flag rates by category with false-positive rates, dispute outcomes, model drift (PSI), evidence-deletion compliance, and transparency-log health with the published Merkle root — are open to institutions and the public. Counts below the k-anonymity threshold of 5 are suppressed, so no individual is ever identifiable. *(See [`docs/public-transparency-dashboard.md`](docs/public-transparency-dashboard.md))*

---

## How the System Works (Pipeline)

```
 Enroll → Login → Exam Session → Behavioral Scoring → Explainable Flags
                                                            │
            ┌───────────────────────────────────────────────┤
            ▼                                               ▼
     Dispute Pipeline                              Credential Issuance
     (evidence escrow,                             (Ed25519-signed VC)
      90-day retention)                                     │
            │                                               ▼
            └──────────────► Transparency Log ◄── Wallet / Credential Bridge
                          (Merkle, hash-chained)   (VC / VP / JWT / QR / passes)
                                    │
                                    ▼
                       Public Transparency Dashboard
                          (k-anonymized metrics)
```

### 1. Enrollment & Identity
A student enrolls and receives a **DID** (decentralized identifier) backed by an Ed25519 keypair (`services/api/src/services/identity`). The public key is registered with the platform; the private key proves identity from then on.

### 2. Login (Challenge / Response)
No passwords. The server issues a single-use, 5-minute nonce; the student signs it with their private key, and the server verifies the signature against the stored public key before minting a JWT (`services/api/src/auth/authService.ts`).

### 3. Exam Session & Behavioral Events
During an exam, behavioral events (gaze, typing cadence, audio, device integrity) are captured as a session event stream (`services/api/src/services/session`). The Go realtime service (`services/realtime`) fans events out over WebSockets via Redis pub/sub for live monitoring.

### 4. Scoring & Explanation Building
The Python scoring service (`services/scoring`) evaluates each signal against the student's **personal baseline** and the **accommodation-adjusted threshold**. Severity is derived from `observed / adjustedThreshold`; within-threshold observations auto-resolve. The API has an equivalent local fallback builder, so explanations are always available even if the scoring service is down.

### 5. Explainable Flag Cards
Each flag is rendered to the student as a card showing what was observed, how it compares to their baseline and the threshold, whether an accommodation applied, model confidence, and the recommended action (`apps/web/src/components/exam`).

### 6. Dispute Pipeline & Evidence Escrow
Disputable flags can be contested (`services/api/src/services/dispute`). Supporting evidence is held in escrow (`services/api/src/services/escrow`) and automatically deleted once its 90-day retention window expires — deletion compliance is itself a published metric.

### 7. Credential Issuance
When a session completes cleanly (or disputes resolve), the platform issues a **W3C Verifiable Credential** with an integrity score band, signed with the platform's Ed25519 key (`services/api/src/services/credential`).

### 8. Transparency Log
Issuance and key lifecycle events are appended to a hash-chained log whose Merkle root (RFC 6962 leaf/node domain separation, `packages/crypto-utils/src/merkle.ts`) is published and independently verifiable.
### 9. Wallet & Credential Bridge
Students export or share their credential from the wallet (`apps/web/src/app/wallet`): VC JSON, Ed25519-signed Verifiable Presentation, compact JWT, short-lived QR verification links, LinkedIn share, and Apple/Google Wallet + OID4VCI (demo stubs pending issuer certificates).

### 10. Public Transparency Dashboard
Aggregate accountability metrics — flag rates by category, false-positive rates, dispute outcomes, model drift (PSI), deletion compliance, and log health — are published at `/transparency` with k-anonymity suppression so no individual is identifiable.

---

## Architecture

| Component | Stack | Role |
|---|---|---|
| `apps/web` | Next.js (App Router) | Student/web UI: enroll, exam, wallet, transparency |
| `services/api` | Fastify · TypeScript | Core API: auth, sessions, disputes, credentials, transparency |
| `services/scoring` | FastAPI · Python | Behavioral scoring + deterministic explanation builder |
| `services/realtime` | Go · WebSockets · Redis | Live session event fan-out |
| `packages/crypto-utils` | TypeScript | Ed25519 signing, encryption, Merkle tree |
| `packages/shared-types` | TypeScript | Shared data contracts across services |
| `infrastructure` | Docker · SQL | Postgres init, migrations, seed, docker-compose |
## Getting Started

```bash
# 1. Install dependencies (pnpm workspace)
pnpm install

# 2. Start Postgres + Redis
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 3. Initialize the database
psql "$DATABASE_URL" -f infrastructure/db/init.sql
psql "$DATABASE_URL" -f infrastructure/db/migrations/010_identity.sql
psql "$DATABASE_URL" -f infrastructure/db/seed.sql   # optional demo data

# 4. Configure environment
cp .env.example .env                       # fill in real values
cp services/api/.env.example services/api/.env

# 5. Run the API and web app
pnpm --filter @examidentity/api dev
pnpm --filter web dev                      # http://localhost:3000
```

The scoring (`services/scoring`) and realtime (`services/realtime`) services are optional for the MVP — the API falls back to a local explanation builder when scoring is unreachable.

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for production deployment, and the feature deep-dives in [`docs/`](docs/) for the flag explanation, credential bridge, and transparency dashboard designs.

## License

See [MIT](LICENSE).