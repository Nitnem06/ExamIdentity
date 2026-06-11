import test from 'node:test'
import assert from 'node:assert/strict'
import {
  pct,
  roundHours,
  roundRate,
  suppressSmallCount,
} from '../src/services/transparency/anonymizationService'
import {
  disputeReviewSchema,
  enrollSchema,
  eventIngestionSchema,
  validate,
} from '../src/validation/schemas'

test('pct computes a rounded percentage and guards divide-by-zero', () => {
  assert.equal(pct(1, 4), 25)
  assert.equal(pct(1, 0), 0)
  assert.equal(pct(962, 4820), 20)
})

test('suppressSmallCount enforces k-anonymity (k=5)', () => {
  assert.equal(suppressSmallCount(3), 0)
  assert.equal(suppressSmallCount(4), 0)
  assert.equal(suppressSmallCount(5), 5)
  assert.equal(suppressSmallCount(120), 120)
})

test('roundRate / roundHours round to one decimal', () => {
  assert.equal(roundRate(20.04), 20)
  assert.equal(roundRate(21.96), 22)
  assert.equal(roundHours(18.44), 18.4)
})

test('enroll validation rejects missing universityId', () => {
  const r = validate(enrollSchema, {})
  assert.equal(r.ok, false)
})

test('enroll validation accepts a valid body', () => {
  const r = validate(enrollSchema, { universityId: 'univ-demo', custodyTier: 'SELF_CUSTODY' })
  assert.equal(r.ok, true)
})

test('event validation requires at least one signal', () => {
  const r = validate(eventIngestionSchema, { signals: [] })
  assert.equal(r.ok, false)
})

test('event validation accepts a well-formed signal', () => {
  const r = validate(eventIngestionSchema, {
    signals: [
      {
        type: 'GAZE_AWAY',
        startedAt: '2026-06-11T10:00:00Z',
        endedAt: '2026-06-11T10:00:10Z',
        observedValue: 12,
        baselineValue: 3,
      },
    ],
  })
  assert.equal(r.ok, true)
})

test('dispute review rejects an invalid decision', () => {
  const r = validate(disputeReviewSchema, { decision: 'MAYBE', reasoning: 'x' })
  assert.equal(r.ok, false)
})
