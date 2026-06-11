// API-side types for Explainable Flag Cards.
// Re-exports the shared domain types and adds request/response envelopes used
// only by the HTTP layer.

export type {
  FlagExplanation,
  FlagReason,
  FlagEvidencePoint,
  TimeRange,
  AccommodationType,
  RecommendedAction,
  SessionFlagExplanations,
} from '@examidentity/shared-types'

import type { AccommodationType } from '@examidentity/shared-types'

/** Query options accepted by GET /api/sessions/:sessionId/explanations. */
export interface GetExplanationsQuery {
  /** Override the accommodation used when (re)building explanations. */
  accommodation?: AccommodationType
}
