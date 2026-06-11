// Metric snapshot service.
//
// Captures point-in-time snapshots of the public metrics and exposes simple
// trend timeseries for the dashboard charts. Snapshots are kept in memory for
// the MVP; in production they would be persisted to the metric_snapshots table.

import type {
  MetricSnapshot,
  MetricTimeseries,
  TransparencyMetrics,
} from '@examidentity/shared-types'
import { getTransparencyMetrics } from './publicMetricsService'
import { snapshotHash } from './transparencyHealthService'

export function captureSnapshot(metrics?: TransparencyMetrics): MetricSnapshot {
  const m = metrics ?? getTransparencyMetrics()
  const serialized = JSON.stringify({
    period: [m.periodStart, m.periodEnd],
    flagRatePct: m.flagRatePct,
    credentialsIssued: m.credentialsIssued,
  })
  return {
    snapshotId: snapshotHash(serialized).slice(0, 16),
    capturedAt: m.generatedAt,
    periodStart: m.periodStart,
    periodEnd: m.periodEnd,
    metrics: m,
  }
}

// Deterministic 6-month history for trend charts.
const HISTORY: Record<string, Array<{ date: string; value: number }>> = {
  exams_protected: [
    { date: '2026-01', value: 2980 },
    { date: '2026-02', value: 3240 },
    { date: '2026-03', value: 3610 },
    { date: '2026-04', value: 4015 },
    { date: '2026-05', value: 4290 },
    { date: '2026-06', value: 4820 },
  ],
  flag_rate: [
    { date: '2026-01', value: 23.1 },
    { date: '2026-02', value: 22.4 },
    { date: '2026-03', value: 21.8 },
    { date: '2026-04', value: 20.9 },
    { date: '2026-05', value: 20.4 },
    { date: '2026-06', value: 19.9 },
  ],
  dispute_overturn_rate: [
    { date: '2026-01', value: 19.7 },
    { date: '2026-02', value: 20.5 },
    { date: '2026-03', value: 21.0 },
    { date: '2026-04', value: 21.4 },
    { date: '2026-05', value: 21.6 },
    { date: '2026-06', value: 21.9 },
  ],
}

const SERIES_META: Record<string, { label: string; unit?: string }> = {
  exams_protected: { label: 'Exams Protected' },
  flag_rate: { label: 'Flag Rate', unit: '%' },
  dispute_overturn_rate: { label: 'Disputes Overturned', unit: '%' },
}

export function getMetricTimeseries(): MetricTimeseries[] {
  return Object.entries(HISTORY).map(([key, points]) => ({
    key,
    label: SERIES_META[key]?.label ?? key,
    unit: SERIES_META[key]?.unit,
    points,
  }))
}
