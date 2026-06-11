// Flag explanation service.
//
// Primary path: ask the Python scoring service to build explainable flag cards.
// Fallback path: if the scoring service is unreachable, build deterministic
// explanations locally so the MVP demo still works end-to-end.

import { config } from '../../config'
import { sessionRepository } from '../../data'
import type {
  AccommodationType,
  FlagExplanation,
  FlagSignalInput,
  RecommendedAction,
  SessionFlagExplanations,
} from '@examidentity/shared-types'

type FlagType =
  | 'GAZE_AWAY'
  | 'TYPING_IDENTITY_DRIFT'
  | 'MULTIPLE_VOICES'
  | 'SYSTEMIC_EVENT'
  | 'DEVICE_INTEGRITY'

type FlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

const MODEL_VERSION = 'explain-rules-ts-0.1.0'

const BASE_THRESHOLDS: Record<FlagType, number> = {
  GAZE_AWAY: 8.0,
  TYPING_IDENTITY_DRIFT: 0.35,
  MULTIPLE_VOICES: 1.0,
  SYSTEMIC_EVENT: 1.0,
  DEVICE_INTEGRITY: 1.0,
}

const GAZE_MULTIPLIER: Partial<Record<AccommodationType, number>> = {
  EXTENDED_TIME: 1.5,
  SCREEN_READER: 3.0,
  BREAKS_ALLOWED: 2.0,
  ASSISTIVE_TECH: 2.0,
  REDUCED_DISTRACTION: 1.25,
}

interface RawSignal {
  type: FlagType
  startedAt: string
  endedAt: string
  observedValue: number
  baselineValue: number
  confidence: number
  unit: string
  title: string
  code: string
}

const DEMO_SIGNALS: RawSignal[] = [
  {
    type: 'GAZE_AWAY',
    startedAt: '2026-06-10T10:14:02Z',
    endedAt: '2026-06-10T10:14:14Z',
    observedValue: 12.0,
    baselineValue: 2.5,
    confidence: 0.86,
    unit: 'seconds',
    title: 'Looked away from screen',
    code: 'GAZE_OFFSCREEN_DURATION',
  },
  {
    type: 'TYPING_IDENTITY_DRIFT',
    startedAt: '2026-06-10T10:31:00Z',
    endedAt: '2026-06-10T10:33:00Z',
    observedValue: 0.41,
    baselineValue: 0.08,
    confidence: 0.73,
    unit: 'drift',
    title: 'Typing rhythm differs from baseline',
    code: 'KEYSTROKE_DRIFT',
  },
  {
    type: 'GAZE_AWAY',
    startedAt: '2026-06-10T10:45:00Z',
    endedAt: '2026-06-10T10:45:18Z',
    observedValue: 18.0,
    baselineValue: 15.0,
    confidence: 0.9,
    unit: 'seconds',
    title: 'Looked away from screen',
    code: 'GAZE_OFFSCREEN_DURATION',
  },
]

function durationSeconds(start: string, end: string): number {
  const s = Date.parse(start)
  const e = Date.parse(end)
  return Number.isFinite(s) && Number.isFinite(e) ? Math.max(0, (e - s) / 1000) : 0
}

function adjustedThreshold(type: FlagType, accommodation: AccommodationType): number {
  const base = BASE_THRESHOLDS[type]
  if (type === 'GAZE_AWAY') {
    return Math.round(base * (GAZE_MULTIPLIER[accommodation] ?? 1) * 10000) / 10000
  }
  return base
}

function severityForRatio(ratio: number, autoResolved: boolean): FlagSeverity {
  if (autoResolved || ratio < 1) return 'LOW'
  if (ratio < 1.5) return 'MEDIUM'
  if (ratio < 2.5) return 'HIGH'
  return 'CRITICAL'
}

function recommendedAction(severity: FlagSeverity, autoResolved: boolean): RecommendedAction {
  if (autoResolved) return 'AUTO_RESOLVED'
  const map: Record<FlagSeverity, RecommendedAction> = {
    LOW: 'MONITOR',
    MEDIUM: 'STUDENT_REVIEW',
    HIGH: 'MANUAL_REVIEW',
    CRITICAL: 'ESCALATE',
  }
  return map[severity]
}

function buildLocalExplanations(
  sessionId: string,
  studentDid: string,
  examId: string,
  accommodation: AccommodationType,
  signals: RawSignal[],
): SessionFlagExplanations {
  const generatedAt = new Date().toISOString()
  const explanations: FlagExplanation[] = signals.map((sig, i) => {
    const adjusted = adjustedThreshold(sig.type, accommodation)
    const policy = BASE_THRESHOLDS[sig.type]
    const ratio = adjusted > 0 ? sig.observedValue / adjusted : sig.observedValue
    const autoResolved = sig.observedValue <= adjusted
    const severity = severityForRatio(ratio, autoResolved)
    const accommodationNote =
      adjusted !== policy
        ? `Threshold relaxed from ${policy} to ${adjusted} for the ${accommodation
            .replace(/_/g, ' ')
            .toLowerCase()} accommodation.`
        : undefined
    return {
      flagId: `${sessionId}-flag-${i + 1}`,
      sessionId,
      type: sig.type,
      severity,
      timeRange: {
        startedAt: sig.startedAt,
        endedAt: sig.endedAt,
        durationSeconds: durationSeconds(sig.startedAt, sig.endedAt),
      },
      observedValue: sig.observedValue,
      baselineValue: sig.baselineValue,
      policyThreshold: policy,
      adjustedThreshold: adjusted,
      accommodationApplied: accommodation,
      accommodationAdjustment: accommodationNote,
      confidence: sig.confidence,
      summary: autoResolved
        ? `Observed ${sig.observedValue} ${sig.unit}, within the ${adjusted} ${sig.unit} threshold. No action required.`
        : `Observed ${sig.observedValue} ${sig.unit}, ${
            Math.round((sig.observedValue - adjusted) * 100) / 100
          } ${sig.unit} over the ${adjusted} ${sig.unit} threshold.`,
      reasons: [
        {
          code: sig.code,
          title: sig.title,
          description: `Measured ${sig.observedValue} ${sig.unit} versus a personal baseline of ${sig.baselineValue} ${sig.unit}.`,
          weight: 1,
          observedValue: sig.observedValue,
          baselineValue: sig.baselineValue,
        },
      ],
      evidenceTimeline: [
        {
          timestamp: sig.startedAt,
          label: `${sig.title} started`,
          observedValue: sig.observedValue,
          thresholdValue: adjusted,
          exceeded: !autoResolved,
        },
        {
          timestamp: sig.endedAt,
          label: `${sig.title} ended`,
          observedValue: sig.observedValue,
          thresholdValue: adjusted,
          exceeded: !autoResolved,
        },
      ],
      recommendedAction: recommendedAction(severity, autoResolved),
      autoResolved,
      disputable: !autoResolved,
      modelVersion: MODEL_VERSION,
      generatedAt,
    }
  })

  return { sessionId, studentDid, examId, generatedAt, explanations }
}

/**
 * Get explainable flag cards for a session. Tries the scoring service first,
 * then falls back to the local deterministic builder.
 */
export async function getSessionExplanations(
  sessionId: string,
  accommodationOverride?: AccommodationType,
): Promise<SessionFlagExplanations> {
  const session = await sessionRepository.findById(sessionId)
  const accommodation = (accommodationOverride ??
    (session?.accommodation as AccommodationType) ??
    'NONE') as AccommodationType
  const studentDid = session?.studentDid ?? 'did:key:zDemoStudent'
  const examId = session?.examId ?? 'exam-unknown'

  try {
    const url = `${config.scoringServiceUrl}/api/explanation/demo/${encodeURIComponent(
      sessionId,
    )}?accommodation=${accommodation}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (res.ok) {
      return (await res.json()) as SessionFlagExplanations
    }
  } catch {
    // fall through to local builder
  }

  return buildLocalExplanations(sessionId, studentDid, examId, accommodation, DEMO_SIGNALS)
}


// ---- Event-driven explanations (Phase 4) ----------------------------------

const FLAG_META: Record<FlagType, { unit: string; title: string; code: string }> = {
  GAZE_AWAY: { unit: 'seconds', title: 'Looked away from screen', code: 'GAZE_OFFSCREEN_DURATION' },
  TYPING_IDENTITY_DRIFT: {
    unit: 'drift',
    title: 'Typing rhythm differs from baseline',
    code: 'KEYSTROKE_DRIFT',
  },
  MULTIPLE_VOICES: { unit: 'voices', title: 'Additional voice detected', code: 'ADDITIONAL_VOICE' },
  SYSTEMIC_EVENT: { unit: 'events', title: 'Platform-wide anomaly', code: 'SYSTEMIC_ANOMALY' },
  DEVICE_INTEGRITY: {
    unit: 'violations',
    title: 'Device integrity concern',
    code: 'DEVICE_INTEGRITY',
  },
}

function enrich(input: FlagSignalInput): RawSignal {
  const meta = FLAG_META[input.type as FlagType] ?? FLAG_META.SYSTEMIC_EVENT
  return {
    type: input.type as FlagType,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    observedValue: input.observedValue,
    baselineValue: input.baselineValue,
    confidence: input.confidence ?? 0.8,
    unit: meta.unit,
    title: meta.title,
    code: meta.code,
  }
}

/**
 * Build explanations from caller-supplied behavioural signals. Tries the
 * scoring service's /api/explanation/build, then falls back to the local
 * deterministic builder.
 */
export async function getExplanationsForSignals(
  sessionId: string,
  studentDid: string,
  examId: string,
  accommodation: AccommodationType,
  inputs: FlagSignalInput[],
): Promise<SessionFlagExplanations> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(`${config.scoringServiceUrl}/api/explanation/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ sessionId, studentDid, examId, accommodation, signals: inputs }),
    })
    clearTimeout(timeout)
    if (res.ok) {
      return (await res.json()) as SessionFlagExplanations
    }
  } catch {
    // fall through to local builder
  }

  return buildLocalExplanations(sessionId, studentDid, examId, accommodation, inputs.map(enrich))
}
