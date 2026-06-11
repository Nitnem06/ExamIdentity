// Public metrics service.
//
// Assembles the full TransparencyMetrics payload from aggregated (mock)
// counters, passing every count/rate through the anonymization helpers so the
// output is safe to publish.

import type {
  DisputeOutcomes,
  FlagRateByCategory,
  ModelDriftStatus,
  PublicMetric,
  TransparencyMetrics,
} from '@examidentity/shared-types'
import { pct, roundHours, roundRate, suppressSmallCount } from './anonymizationService'
import { getTransparencyLogHealth } from './transparencyHealthService'

// Raw aggregate counters for the reporting period (would come from SQL in prod).
const AGG = {
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

function buildDisputeOutcomes(): DisputeOutcomes {
  const d = AGG.disputes
  return {
    filed: suppressSmallCount(d.filed),
    autoResolved: suppressSmallCount(d.autoResolved),
    overturned: suppressSmallCount(d.overturned),
    upheld: suppressSmallCount(d.upheld),
    pending: suppressSmallCount(d.pending),
    averageResolutionHours: roundHours(d.resolutionHoursTotal / Math.max(1, d.filed)),
  }
}

function buildFlagRateByCategory(): FlagRateByCategory[] {
  return AGG.byCategory.map((c) => ({
    category: c.category,
    flagRatePct: pct(c.totalFlags, AGG.totalSessions),
    totalFlags: suppressSmallCount(c.totalFlags),
    falsePositiveRatePct: pct(c.falsePositives, c.totalFlags),
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

function buildHeadline(metrics: {
  totalExamsProtected: number
  credentialsIssued: number
  flagRatePct: number
  disputeOverturnPct: number
}): PublicMetric[] {
  return [
    {
      key: 'total_exams_protected',
      label: 'Exams Protected',
      value: metrics.totalExamsProtected,
      trend: 'UP',
      changePct: 12.4,
      description: 'Total exam sessions protected this period.',
    },
    {
      key: 'credentials_issued',
      label: 'Credentials Issued',
      value: metrics.credentialsIssued,
      trend: 'UP',
      changePct: 11.1,
      description: 'Verifiable integrity credentials issued to students.',
    },
    {
      key: 'flag_rate',
      label: 'Flag Rate',
      value: metrics.flagRatePct,
      unit: '%',
      trend: 'DOWN',
      changePct: -2.1,
      description: 'Share of sessions with at least one flag.',
    },
    {
      key: 'dispute_overturn_rate',
      label: 'Disputes Overturned',
      value: metrics.disputeOverturnPct,
      unit: '%',
      trend: 'FLAT',
      changePct: 0.3,
      description: 'Disputes resolved in the student\u2019s favour.',
    },
  ]
}

export function getTransparencyMetrics(): TransparencyMetrics {
  const disputes = buildDisputeOutcomes()
  const flagRatePct = pct(AGG.flaggedSessions, AGG.totalSessions)
  const disputeOverturnPct = pct(AGG.disputes.overturned, AGG.disputes.filed)

  const deletion = AGG.deletion
  const now = new Date().toISOString()

  return {
    generatedAt: now,
    periodStart: '2026-05-11T00:00:00Z',
    periodEnd: '2026-06-10T23:59:59Z',
    totalExamsProtected: AGG.totalExamsProtected,
    credentialsIssued: AGG.credentialsIssued,
    flagRatePct,
    disputes,
    accommodation: {
      totalSessions: AGG.totalSessions,
      accommodationAdjustedSessions: AGG.accommodationAdjustedSessions,
      adjustedPct: pct(AGG.accommodationAdjustedSessions, AGG.totalSessions),
    },
    systemicEvents: AGG.systemicEvents,
    flagRateByCategory: buildFlagRateByCategory(),
    deletionCompliance: {
      evidenceDueForDeletion: deletion.evidenceDueForDeletion,
      evidenceDeletedOnTime: deletion.evidenceDeletedOnTime,
      compliancePct: pct(deletion.evidenceDeletedOnTime, deletion.evidenceDueForDeletion),
      oldestUndeletedDays: deletion.oldestUndeletedDays,
      retentionDays: deletion.retentionDays,
    },
    modelDrift: buildModelDrift(),
    logHealth: getTransparencyLogHealth(),
    headlineMetrics: buildHeadline({
      totalExamsProtected: AGG.totalExamsProtected,
      credentialsIssued: AGG.credentialsIssued,
      flagRatePct,
      disputeOverturnPct,
    }),
  }
}
