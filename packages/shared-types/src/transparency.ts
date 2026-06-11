// Public Transparency Dashboard — shared domain types
//
// Aggregate, fully-anonymized accountability metrics. Nothing in this module
// should ever carry personal data (no DIDs, no student identifiers, no raw
// evidence) — only counts, rates and hashes.

/** Direction of a metric relative to the previous snapshot. */
export type MetricTrend = 'UP' | 'DOWN' | 'FLAT'

/** A single headline number rendered as a PublicMetricCard. */
export interface PublicMetric {
  /** Stable machine key, e.g. "total_exams_protected". */
  key: string
  /** Human label, e.g. "Exams Protected". */
  label: string
  /** The numeric value. */
  value: number
  /** Optional unit suffix, e.g. "%", "hrs". */
  unit?: string
  /** Direction vs. the previous period. */
  trend?: MetricTrend
  /** Percentage change vs. previous period. */
  changePct?: number
  /** Short caption explaining what the metric means. */
  description?: string
}

/** Flag rate broken down by behavioural category. */
export interface FlagRateByCategory {
  /** Behavioural category label (maps to FlagType). */
  category: string
  /** Flag rate as a percentage of sessions (0..100). */
  flagRatePct: number
  /** Absolute number of flags raised in this category. */
  totalFlags: number
  /** Estimated false-positive rate for this category (0..100). */
  falsePositiveRatePct: number
}

/** Aggregate dispute outcomes for the period. */
export interface DisputeOutcomes {
  filed: number
  autoResolved: number
  /** Disputes where the flag was overturned in the student's favour. */
  overturned: number
  /** Disputes where the original flag was upheld. */
  upheld: number
  pending: number
  /** Average time to resolve a dispute, in hours. */
  averageResolutionHours: number
}

/** Accommodation coverage statistics. */
export interface AccommodationStats {
  totalSessions: number
  /** Sessions where accommodation-adjusted thresholds were applied. */
  accommodationAdjustedSessions: number
  adjustedPct: number
}

export type DriftStatus = 'STABLE' | 'WATCH' | 'DRIFTING'

/** Per-feature drift contribution. */
export interface FeatureDrift {
  feature: string
  /** Drift magnitude for the feature (e.g. PSI contribution). */
  drift: number
}

/** Model drift / behavioural stability status. */
export interface ModelDriftStatus {
  modelVersion: string
  status: DriftStatus
  /** Population Stability Index across monitored features. */
  psi: number
  lastEvaluatedAt: string
  featureDrift: FeatureDrift[]
}

/** Category B evidence deletion (90-day retention) compliance. */
export interface DeletionCompliance {
  /** Evidence records that have reached their deletion deadline. */
  evidenceDueForDeletion: number
  /** Of those, how many were deleted on or before the deadline. */
  evidenceDeletedOnTime: number
  compliancePct: number
  /** Age in days of the oldest record not yet deleted (0 if none overdue). */
  oldestUndeletedDays: number
  /** Configured retention window in days. */
  retentionDays: number
}

export type LogHealthStatus = 'HEALTHY' | 'DEGRADED' | 'BROKEN'

/** Health of the append-only, hash-chained transparency log. */
export interface TransparencyLogHealth {
  status: LogHealthStatus
  totalEntries: number
  lastEntryHash: string
  lastEntryAt: string
  /** Whether the prev-hash chain verifies end-to-end. */
  chainVerified: boolean
  /** Current Merkle root over all entries. */
  merkleRoot: string
  /** If the chain is broken, the entry index where verification failed. */
  brokenAtIndex?: number
}

/**
 * The complete set of public metrics for a reporting period. This is the
 * payload returned by GET /api/transparency/metrics.
 */
export interface TransparencyMetrics {
  generatedAt: string
  periodStart: string
  periodEnd: string

  totalExamsProtected: number
  credentialsIssued: number
  /** Overall flag rate across all sessions (0..100). */
  flagRatePct: number

  disputes: DisputeOutcomes
  accommodation: AccommodationStats
  /** Count of systemic (platform-wide, non-student) events. */
  systemicEvents: number

  flagRateByCategory: FlagRateByCategory[]
  deletionCompliance: DeletionCompliance
  modelDrift: ModelDriftStatus
  logHealth: TransparencyLogHealth

  /** Pre-computed headline cards for the top of the dashboard. */
  headlineMetrics: PublicMetric[]
}

/** A point-in-time snapshot of the metrics, used for trend history. */
export interface MetricSnapshot {
  snapshotId: string
  capturedAt: string
  periodStart: string
  periodEnd: string
  metrics: TransparencyMetrics
}

/** Lightweight series item for trend charts. */
export interface MetricTimeseriesPoint {
  date: string
  value: number
}

export interface MetricTimeseries {
  key: string
  label: string
  unit?: string
  points: MetricTimeseriesPoint[]
}
