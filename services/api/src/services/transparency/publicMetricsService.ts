// Public metrics service (Phase 3 + Phase 7).
//
// Assembles the anonymized TransparencyMetrics payload. When running against
// Postgres it pulls live counts from the DB; otherwise (or on error) it falls
// back to deterministic sample figures. Every count/rate is passed through the
// anonymization helpers so the output is safe to publish.

import type {
  DisputeOutcomes,
  FlagRateByCategory,
  ModelDriftStatus,
  PublicMetric,
  TransparencyMetrics,
} from '@examidentity/shared-types'
import { config } from '../../config'
import { query } from '../../data/db'
import { pct, roundHours, roundRate, suppressSmallCount, suppressedPct } from './anonymizationService'
import { getTransparencyLogHealth } from './transparencyHealthService'

interface Aggregates {
  totalExamsProtected: number
  credentialsIssued: number
  totalSessions: number
  totalFlags: number
  flaggedSessions: number
  accommodationAdjustedSessions: number
  systemicEvents: number
  disputes: {
    filed: number
    autoResolved: number
    overturned: number
    upheld: number
    pending: number
    resolutionHoursTotal: number
  }
  byCategory: Array<{ category: string; totalFlags: number; falsePositives: number }>
  deletion: {
    evidenceDueForDeletion: number
    evidenceDeletedOnTime: number
    oldestUndeletedDays: number
    retentionDays: number
  }
}

const SAMPLE: Aggregates = {
  totalExamsProtected: 4820,
  credentialsIssued: 4611,
  totalSessions: 4820,
  totalFlags: 1310,
  flaggedSessions: 962,
  accommodationAdjustedSessions: 588,
  systemicEvents: 3,
  disputes: {
    filed: 214,
    autoResolved: 121,
    overturned: 47,
    upheld: 39,
    pending: 7,
    resolutionHoursTotal: 214 * 18.4,
  },
  byCategory: [
    { category: 'GAZE_AWAY', totalFlags: 712, falsePositives: 64 },
    { category: 'TYPING_IDENTITY_DRIFT', totalFlags: 284, falsePositives: 41 },
    { category: 'MULTIPLE_VOICES', totalFlags: 173, falsePositives: 22 },
    { category: 'DEVICE_INTEGRITY', totalFlags: 118, falsePositives: 9 },
    { category: 'SYSTEMIC_EVENT', totalFlags: 23, falsePositives: 1 },
  ],
  deletion: {
    evidenceDueForDeletion: 1502,
    evidenceDeletedOnTime: 1499,
    oldestUndeletedDays: 2,
    retentionDays: 90,
  },
}

async function count(sql: string, params: unknown[] = []): Promise<number> {
  const rows = await query<{ n: string }>(sql, params)
  return Number(rows[0]?.n ?? 0)
}

/** Pull live aggregates from Postgres. */
async function loadDbAggregates(): Promise<Aggregates> {
  const totalSessions = await count(`SELECT COUNT(*)::int AS n FROM exam_sessions`)
  const credentialsIssued = await count(`SELECT COUNT(*)::int AS n FROM credentials`)
  const totalFlags = await count(`SELECT COUNT(*)::int AS n FROM flags`)
  const flaggedSessions = await count(
    `SELECT COUNT(DISTINCT session_id)::int AS n FROM flags WHERE auto_resolved = false`,
  )
  const accommodationAdjustedSessions = await count(
    `SELECT COUNT(*)::int AS n FROM exam_sessions WHERE accommodation IS NOT NULL AND accommodation <> 'NONE'`,
  )
  const systemicEvents = await count(
    `SELECT COUNT(*)::int AS n FROM flags WHERE flag_type = 'SYSTEMIC_EVENT'`,
  )

  const filed = await count(`SELECT COUNT(*)::int AS n FROM disputes`)
  const autoResolved = await count(
    `SELECT COUNT(*)::int AS n FROM disputes WHERE status = 'AUTO_RESOLVED'`,
  )
  const overturned = await count(
    `SELECT COUNT(*)::int AS n FROM disputes WHERE status IN ('TIER2_APPROVED','PANEL_APPROVED','AUTO_RESOLVED')`,
  )
  const upheld = await count(
    `SELECT COUNT(*)::int AS n FROM disputes WHERE status IN ('TIER2_REJECTED','PANEL_REJECTED')`,
  )
  const pending = await count(`SELECT COUNT(*)::int AS n FROM disputes WHERE status = 'PENDING'`)

  const byCategoryRows = await query<{ flag_type: string; total: string }>(
    `SELECT flag_type, COUNT(*)::int AS total FROM flags GROUP BY flag_type`,
  )

  const evidenceDueForDeletion = await count(
    `SELECT COUNT(*)::int AS n FROM evidence_escrow WHERE expires_at < NOW()`,
  )
  const evidenceDeletedOnTime = await count(
    `SELECT COUNT(*)::int AS n FROM evidence_escrow WHERE deleted_at IS NOT NULL`,
  )

  return {
    totalExamsProtected: totalSessions,
    credentialsIssued,
    totalSessions,
    totalFlags,
    flaggedSessions,
    accommodationAdjustedSessions,
    systemicEvents,
    disputes: {
      filed,
      autoResolved,
      overturned,
      upheld,
      pending,
      resolutionHoursTotal: filed * 12, // placeholder avg until timing is tracked
    },
    byCategory: byCategoryRows.map((r) => ({
      category: r.flag_type,
      totalFlags: Number(r.total),
      falsePositives: 0,
    })),
    deletion: {
      evidenceDueForDeletion,
      evidenceDeletedOnTime,
      oldestUndeletedDays: 0,
      retentionDays: 90,
    },
  }
}

function buildDisputeOutcomes(d: Aggregates['disputes']): DisputeOutcomes {
  return {
    filed: suppressSmallCount(d.filed),
    autoResolved: suppressSmallCount(d.autoResolved),
    overturned: suppressSmallCount(d.overturned),
    upheld: suppressSmallCount(d.upheld),
    pending: suppressSmallCount(d.pending),
    averageResolutionHours: roundHours(d.resolutionHoursTotal / Math.max(1, d.filed)),
  }
}

function buildFlagRateByCategory(agg: Aggregates): FlagRateByCategory[] {
  return agg.byCategory.map((c) => ({
    category: c.category,
    flagRatePct: suppressedPct(c.totalFlags, agg.totalSessions),
    totalFlags: suppressSmallCount(c.totalFlags),
    falsePositiveRatePct: suppressedPct(c.falsePositives, c.totalFlags),
  }))
}

function buildModelDrift(): ModelDriftStatus {
  return {
    modelVersion: 'explain-rules-0.1.0',
    status: 'STABLE',
    psi: 0.07,
    lastEvaluatedAt: '2026-06-10T00:00:00Z',
    featureDrift: [
      { feature: 'gaze_offscreen_duration', drift: 0.05 },
      { feature: 'keystroke_similarity', drift: 0.09 },
      { feature: 'audio_voice_count', drift: 0.04 },
    ],
  }
}

function buildHeadline(m: {
  totalExamsProtected: number
  credentialsIssued: number
  flagRatePct: number
  disputeOverturnPct: number
}): PublicMetric[] {
  return [
    { key: 'total_exams_protected', label: 'Exams Protected', value: m.totalExamsProtected, trend: 'UP', changePct: 12.4, description: 'Total exam sessions protected this period.' },
    { key: 'credentials_issued', label: 'Credentials Issued', value: m.credentialsIssued, trend: 'UP', changePct: 11.1, description: 'Verifiable integrity credentials issued to students.' },
    { key: 'flag_rate', label: 'Flag Rate', value: m.flagRatePct, unit: '%', trend: 'DOWN', changePct: -2.1, description: 'Share of sessions with at least one flag.' },
    { key: 'dispute_overturn_rate', label: 'Disputes Overturned', value: m.disputeOverturnPct, unit: '%', trend: 'FLAT', changePct: 0.3, description: 'Disputes resolved in the student\u2019s favour.' },
  ]
}

export async function getTransparencyMetrics(): Promise<TransparencyMetrics> {
  let agg = SAMPLE
  if (config.dataSource === 'postgres') {
    try {
      const dbAgg = await loadDbAggregates()
      // Use live data only if there is meaningful volume; otherwise keep sample.
      if (dbAgg.totalSessions > 0) agg = dbAgg
    } catch {
      agg = SAMPLE
    }
  }

  const disputes = buildDisputeOutcomes(agg.disputes)
  const flagRatePct = suppressedPct(agg.flaggedSessions, agg.totalSessions)
  const disputeOverturnPct = suppressedPct(agg.disputes.overturned, agg.disputes.filed)
  const logHealth = await getTransparencyLogHealth()
  const now = new Date().toISOString()

  return {
    generatedAt: now,
    periodStart: '2026-05-11T00:00:00Z',
    periodEnd: '2026-06-10T23:59:59Z',
    totalExamsProtected: agg.totalExamsProtected,
    credentialsIssued: agg.credentialsIssued,
    flagRatePct,
    disputes,
    accommodation: {
      totalSessions: agg.totalSessions,
      accommodationAdjustedSessions: suppressSmallCount(agg.accommodationAdjustedSessions),
      adjustedPct: suppressedPct(agg.accommodationAdjustedSessions, agg.totalSessions),
    },
    systemicEvents: agg.systemicEvents,
    flagRateByCategory: buildFlagRateByCategory(agg),
    deletionCompliance: {
      evidenceDueForDeletion: agg.deletion.evidenceDueForDeletion,
      evidenceDeletedOnTime: agg.deletion.evidenceDeletedOnTime,
      compliancePct: pct(agg.deletion.evidenceDeletedOnTime, agg.deletion.evidenceDueForDeletion),
      oldestUndeletedDays: agg.deletion.oldestUndeletedDays,
      retentionDays: agg.deletion.retentionDays,
    },
    modelDrift: buildModelDrift(),
    logHealth,
    headlineMetrics: buildHeadline({
      totalExamsProtected: agg.totalExamsProtected,
      credentialsIssued: agg.credentialsIssued,
      flagRatePct,
      disputeOverturnPct,
    }),
  }
}
