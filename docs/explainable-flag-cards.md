# Explainable Flag Cards

Transparent proctoring flags that replace vague "suspicious activity detected"
messages with a clear, evidence-backed explanation a student can understand and
contest.

## Goal

For every flag raised during an exam, show:

- **what** behaviour was observed (with the measured value),
- **how** it compares to the student's personal baseline and the policy
  threshold,
- **whether** an accommodation changed the threshold,
- **how confident** the model is, and
- **what happens next** (recommended action / dispute rights).

## Data contract

The shared type is `FlagExplanation`
(`packages/shared-types/src/explanations.ts`). Every explanation carries:

| Field | Meaning |
| --- | --- |
| `flagId`, `sessionId` | identifiers |
| `type` | `GAZE_AWAY \| TYPING_IDENTITY_DRIFT \| MULTIPLE_VOICES \| SYSTEMIC_EVENT \| DEVICE_INTEGRITY` |
| `severity` | `LOW \| MEDIUM \| HIGH \| CRITICAL` |
| `timeRange` | start/end + duration of the behaviour |
| `observedValue` / `baselineValue` | measured vs. the student's personal baseline |
| `policyThreshold` / `adjustedThreshold` | standard threshold vs. accommodation-adjusted |
| `accommodationApplied` / `accommodationAdjustment` | accommodation and a human note |
| `confidence` | model confidence `0..1` |
| `summary` | one-paragraph plain-language explanation |
| `reasons[]` | contributing reasons (observed vs. baseline, weighted) |
| `evidenceTimeline[]` | per-sample evidence with threshold crossings |
| `recommendedAction` | `AUTO_RESOLVED \| MONITOR \| STUDENT_REVIEW \| MANUAL_REVIEW \| ESCALATE` |
| `autoResolved`, `disputable` | resolution + whether the student can dispute |
| `modelVersion`, `generatedAt` | provenance |

## Services

### Scoring service (Python / FastAPI)

- `app/schemas/explanation.py` — Pydantic models mirroring the shared types.
- `app/services/accommodation_thresholds.py` — base policy thresholds per flag
  type and accommodation multipliers (e.g. a `SCREEN_READER` accommodation
  relaxes the off-screen gaze threshold 3×).
- `app/services/explanation_builder.py` — deterministic, **rule-based** builder
  (not a black box): severity is derived from `observed / adjustedThreshold`,
  and a within-threshold observation is `autoResolved`.
- `app/routers/explanation.py`
  - `POST /api/explanation/build` — build explanations from raw signals.
  - `GET /api/explanation/demo/{sessionId}?accommodation=` — deterministic demo.

### API service (TypeScript / Fastify)

- `src/services/session/flagExplanationService.ts` — calls the scoring service,
  and **falls back** to an equivalent local builder if scoring is unreachable,
  so the demo always works.
- `src/routes/explanations.ts`
  - `GET /api/sessions/:sessionId/explanations?accommodation=`

## Web (Next.js)

- `src/components/exam/ExplainableFlagCard.tsx` — expandable card showing the
  summary, observed/baseline/threshold/confidence, accommodation note, the
  reason list, the evidence timeline, and a **Dispute** action.
- `FlagSeverityBadge.tsx`, `FlagReasonList.tsx`, `FlagEvidenceTimeline.tsx` —
  supporting components.
- `src/lib/api/explanations.ts` — `fetchSessionExplanations` +
  `useSessionExplanations` (React Query).
- Demo page: `src/app/exam/page.tsx` (switch the accommodation to see flags
  auto-resolve as thresholds relax).

## Try it

```bash
# API (port 3001) — also works without the scoring service via local fallback
pnpm --filter @examidentity/api dev

# Web (port 3000)
pnpm --filter web dev
# open http://localhost:3000/exam
```

## Accommodation example

With `accommodation=NONE`, a 12-second off-screen gaze exceeds the 8-second
policy threshold → flagged `MEDIUM`. With `accommodation=SCREEN_READER`, the
threshold becomes `8 × 3 = 24s`, so the same 12-second gaze is **auto-resolved**
and the card explains exactly why.
