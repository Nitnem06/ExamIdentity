// Explainable Flag Cards — shared domain types
//
// These types describe the transparent, human-readable explanation that
// accompanies every proctoring flag. They are shared across the scoring
// service (Python), the API (TypeScript/Fastify) and the web client.

import type { FlagType, FlagSeverity } from './index'

/**
 * Accommodations that can change the policy thresholds applied to a session.
 * `NONE` means standard policy thresholds were used.
 */
export type AccommodationType =
  | 'NONE'
  | 'EXTENDED_TIME'
  | 'SCREEN_READER'
  | 'BREAKS_ALLOWED'
  | 'SEPARATE_ROOM'
  | 'ASSISTIVE_TECH'
  | 'REDUCED_DISTRACTION'

/**
 * What the system recommends a human reviewer / the student do about a flag.
 */
export type RecommendedAction =
  | 'NO_ACTION'
  | 'AUTO_RESOLVED'
  | 'STUDENT_REVIEW'
  | 'MONITOR'
  | 'MANUAL_REVIEW'
  | 'ESCALATE'

/** A bounded window of exam time that a flag refers to. */
export interface TimeRange {
  /** ISO-8601 timestamp when the observed behaviour started. */
  startedAt: string
  /** ISO-8601 timestamp when the observed behaviour ended. */
  endedAt: string
  /** Convenience duration in seconds (endedAt - startedAt). */
  durationSeconds: number
}

/**
 * A single point on the evidence timeline for a flag. Used to render the
 * FlagEvidenceTimeline component so a student can see exactly when and by how
 * much a measured signal crossed its threshold.
 */
export interface FlagEvidencePoint {
  /** ISO-8601 timestamp of the sample. */
  timestamp: string
  /** Short human label, e.g. "Gaze left screen". */
  label: string
  /** The measured value at this moment. */
  observedValue: number
  /** The threshold that applied at this moment (accommodation-adjusted). */
  thresholdValue: number
  /** Whether the observed value crossed the threshold at this point. */
  exceeded: boolean
  /** Optional extra detail shown on hover / expand. */
  detail?: string
}

/**
 * One contributing reason for the flag. A flag may have several reasons; each
 * compares an observed value against the student's personal baseline.
 */
export interface FlagReason {
  /** Stable machine code, e.g. "GAZE_OFFSCREEN_DURATION". */
  code: string
  /** Short title, e.g. "Looked away from screen". */
  title: string
  /** Plain-language description of what was observed. */
  description: string
  /** Relative contribution of this reason to the overall flag (0..1). */
  weight: number
  /** Observed value for this reason. */
  observedValue: number
  /** The student's personal baseline value for this reason. */
  baselineValue: number
}

/**
 * The complete explanation for a single flag. Contains everything the UI needs
 * to render an ExplainableFlagCard without further lookups.
 */
export interface FlagExplanation {
  flagId: string
  sessionId: string
  type: FlagType
  severity: FlagSeverity

  /** When during the exam the behaviour occurred. */
  timeRange: TimeRange

  /** Headline observed value (e.g. seconds off-screen). */
  observedValue: number
  /** The student's personal baseline for the headline metric. */
  baselineValue: number
  /** The standard policy threshold before accommodation. */
  policyThreshold: number
  /** The threshold actually applied after accommodation adjustment. */
  adjustedThreshold: number

  /** Accommodation applied to this session (affects adjustedThreshold). */
  accommodationApplied: AccommodationType
  /** Human-readable note about how the accommodation changed the threshold. */
  accommodationAdjustment?: string

  /** Model confidence in this flag (0..1). */
  confidence: number

  /** Plain-language, one-paragraph explanation suitable for a student. */
  summary: string

  /** Ordered list of contributing reasons (most significant first). */
  reasons: FlagReason[]

  /** Per-sample timeline of the evidence behind the flag. */
  evidenceTimeline: FlagEvidencePoint[]

  /** What the system recommends happens next. */
  recommendedAction: RecommendedAction

  /** Whether the flag was auto-resolved (e.g. accommodation absorbed it). */
  autoResolved: boolean

  /** Whether the student is allowed to dispute this flag. */
  disputable: boolean

  /** Version of the scoring model that produced the explanation. */
  modelVersion: string

  /** ISO-8601 timestamp the explanation was generated. */
  generatedAt: string
}

/** API response shape for fetching all explanations of a session. */
export interface SessionFlagExplanations {
  sessionId: string
  studentDid: string
  examId: string
  generatedAt: string
  explanations: FlagExplanation[]
}
