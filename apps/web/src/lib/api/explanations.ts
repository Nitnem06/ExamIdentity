// apps/web/src/lib/api/explanations.ts
//
// Adapts the real API (`GET /api/sessions/:id/explanations`,
// `POST /api/disputes`) into the dashboard's ExplainableFlag shape. Uses the
// shared, token-aware axios client so authenticated calls carry the JWT.

import axios from 'axios'
import { apiClient } from './client'
import type {
  ExplainableFlag,
  FlagExplanationResponse,
  FlagSeverity,
  FlagType,
  RecommendedAction,
} from '@/types/explanations'

// Legacy client kept for the (currently unused) helpers below.
const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  timeout: 10_000,
})

// ── Real API response shapes ───────────────────────────────────
interface ApiFlagExplanation {
  flagId: string
  sessionId: string
  type: 'GAZE_AWAY' | 'TYPING_IDENTITY_DRIFT' | 'MULTIPLE_VOICES' | 'SYSTEMIC_EVENT' | 'DEVICE_INTEGRITY'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timeRange: { startedAt: string; endedAt: string; durationSeconds: number }
  observedValue: number
  baselineValue: number
  policyThreshold: number
  adjustedThreshold: number
  accommodationApplied: string
  accommodationAdjustment?: string
  confidence: number
  summary: string
  recommendedAction: 'NO_ACTION' | 'AUTO_RESOLVED' | 'STUDENT_REVIEW' | 'MONITOR' | 'MANUAL_REVIEW' | 'ESCALATE'
  autoResolved: boolean
  disputable: boolean
  generatedAt: string
}

interface ApiSessionExplanations {
  sessionId: string
  studentDid: string
  examId: string
  generatedAt: string
  explanations: ApiFlagExplanation[]
}

const TYPE_MAP: Record<ApiFlagExplanation['type'], FlagType> = {
  GAZE_AWAY: 'gaze_deviation',
  TYPING_IDENTITY_DRIFT: 'unusual_keystroke_pattern',
  MULTIPLE_VOICES: 'audio_anomaly',
  DEVICE_INTEGRITY: 'screen_share_detected',
  SYSTEMIC_EVENT: 'tab_switch',
}

const ACTION_MAP: Record<ApiFlagExplanation['recommendedAction'], RecommendedAction> = {
  AUTO_RESOLVED: 'auto_resolved',
  NO_ACTION: 'auto_resolved',
  MONITOR: 'note_for_review',
  STUDENT_REVIEW: 'note_for_review',
  MANUAL_REVIEW: 'flag_for_manual_review',
  ESCALATE: 'escalate_to_institution',
}

function prettify(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function adaptFlag(f: ApiFlagExplanation): ExplainableFlag {
  return {
    id: f.flagId,
    sessionId: f.sessionId,
    type: TYPE_MAP[f.type] ?? 'gaze_deviation',
    severity: f.severity.toLowerCase() as FlagSeverity,
    timeRange: {
      start: Date.parse(f.timeRange.startedAt),
      end: Date.parse(f.timeRange.endedAt),
    },
    observedValue: f.observedValue,
    baselineValue: f.baselineValue,
    policyThreshold: f.policyThreshold,
    adjustedThreshold: f.adjustedThreshold,
    accommodation: {
      applied: f.accommodationApplied !== 'NONE',
      type: f.accommodationApplied !== 'NONE' ? prettify(f.accommodationApplied) : undefined,
      description: f.accommodationAdjustment,
    },
    confidence: f.confidence,
    explanation: f.summary,
    recommendedAction: ACTION_MAP[f.recommendedAction] ?? 'note_for_review',
    createdAt: f.generatedAt,
  }
}

function adaptResponse(s: ApiSessionExplanations): FlagExplanationResponse {
  const flags = s.explanations.map(adaptFlag)
  return {
    sessionId: s.sessionId,
    studentDid: s.studentDid,
    examId: s.examId,
    examTitle: s.examId,
    institutionName: '',
    sessionDate: s.generatedAt,
    flags,
    totalFlags: flags.length,
    highSeverityCount: flags.filter((f) => f.severity === 'high' || f.severity === 'critical').length,
    reviewStatus: 'pending',
  }
}

/** Fetch + adapt all explainable flags for a session (optional accommodation override). */
export async function getSessionFlags(
  sessionId: string,
  accommodation?: string,
): Promise<FlagExplanationResponse> {
  const { data } = await apiClient.get<ApiSessionExplanations>(
    `/api/sessions/${encodeURIComponent(sessionId)}/explanations`,
    { params: accommodation ? { accommodation } : undefined },
  )
  return adaptResponse(data)
}

/** Submit a dispute for a flag (requires a logged-in student). */
export async function disputeFlag(
  flagId: string,
  reason: string,
): Promise<{ disputeId: string; flagId: string; submittedAt: string }> {
  const { data } = await apiClient.post<{ disputeId: string; flagId: string; createdAt: string }>(
    '/api/disputes',
    { flagId, reason },
  )
  return { disputeId: data.disputeId, flagId: data.flagId, submittedAt: data.createdAt }
}

// ── Unused legacy helpers (kept for reference; endpoints not yet implemented) ─
export async function getFlagDetail(flagId: string): Promise<ExplainableFlag> {
  const { data } = await client.get<ExplainableFlag>(`/api/explanations/flag/${flagId}`)
  return data
}
