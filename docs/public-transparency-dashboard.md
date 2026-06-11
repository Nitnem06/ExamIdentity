# Public Transparency Dashboard

Aggregate, fully-anonymized accountability metrics for the ExamIdentity
platform. Shows institutions and the public how the system behaves — flag rates,
dispute outcomes, model drift, evidence-deletion compliance and the health of
the transparency log — **without exposing any personal data**.

## Privacy guarantees

- Only counts, rates and cryptographic hashes are published.
- Counts below a **k-anonymity threshold of 5** are suppressed
  (`anonymizationService.suppressSmallCount`).
- Rates are rounded to one decimal place.
- No DIDs, student identifiers, or raw evidence ever pass through this surface.

## Metrics

`TransparencyMetrics` (`packages/shared-types/src/transparency.ts`) includes:

- `totalExamsProtected`, `credentialsIssued`
- `flagRatePct` and `flagRateByCategory[]` (with per-category false-positive
  rate)
- `disputes` — filed / autoResolved / overturned / upheld / pending +
  `averageResolutionHours`
- `accommodation` — accommodation-adjusted session share
- `systemicEvents`
- `deletionCompliance` — Category B evidence deleted on time vs. the 90-day
  retention window
- `modelDrift` — status + PSI + per-feature drift
- `logHealth` — hash-chain verification + Merkle root
- `headlineMetrics[]` — pre-computed cards for the top of the dashboard

## Services (API · TypeScript / Fastify)

- `src/services/transparency/anonymizationService.ts` — k-anonymity suppression
  and rounding helpers.
- `src/services/transparency/publicMetricsService.ts` — assembles the full
  payload from aggregate counters (swap these for SQL aggregates in prod).
- `src/services/transparency/transparencyHealthService.ts` — builds and verifies
  the hash-chained log and computes the Merkle root via
  `@examidentity/crypto-utils`.
- `src/services/transparency/metricSnapshotService.ts` — point-in-time snapshots
  and trend timeseries.
- `src/routes/transparency.ts`
  - `GET /api/transparency/metrics`
  - `GET /api/transparency/timeseries`
  - `GET /api/transparency/log-health`
  - `GET /api/transparency/snapshot`

## Web (Next.js)

- Page: `src/app/transparency/page.tsx`
- `src/components/transparency/PublicMetricsDashboard.tsx` — composes:
  - `PublicMetricCard.tsx` (headline cards with trend arrows)
  - `FlagRateByCategoryChart.tsx` (Recharts bar chart)
  - `DisputeOutcomesChart.tsx` (Recharts donut)
  - a trend line chart from the timeseries endpoint
  - `DeletionCompliancePanel.tsx`, `ModelDriftPanel.tsx`,
    `TransparencyLogHealthPanel.tsx`
- Libs: `src/lib/api/transparency.ts` (`useTransparencyMetrics`,
  `useMetricTimeseries`).

## Transparency log health

The log is append-only and hash-chained: each entry stores
`entryHash = SHA-256(prevHash || canonicalPayload)`. The health service
re-derives the chain end-to-end; if any link fails it reports `BROKEN` with the
offending index. The Merkle root over all entry hashes gives a single
tamper-evident commitment. **No personal data is stored in the log** — only
hashes and non-identifying references (consistent with the GDPR-erasure rationale
for avoiding a blockchain in the MVP).

## Try it

```bash
pnpm --filter @examidentity/api dev   # port 3001
pnpm --filter web dev                 # port 3000
# open http://localhost:3000/transparency
```
