// Request validation schemas (Phase 8) using zod.
import { z } from 'zod'

export const enrollSchema = z.object({
  universityId: z.string().min(1),
  custodyTier: z.enum(['SELF_CUSTODY', 'STANDARD']).optional(),
  accommodation: z
    .enum([
      'NONE',
      'EXTENDED_TIME',
      'SCREEN_READER',
      'BREAKS_ALLOWED',
      'SEPARATE_ROOM',
      'ASSISTIVE_TECH',
      'REDUCED_DISTRACTION',
    ])
    .optional(),
})

export const createSessionSchema = z.object({
  examId: z.string().min(1),
  examName: z.string().optional(),
  studentDid: z.string().optional(),
  accommodation: z.string().optional(),
})

const flagSignalSchema = z.object({
  type: z.enum([
    'GAZE_AWAY',
    'TYPING_IDENTITY_DRIFT',
    'MULTIPLE_VOICES',
    'SYSTEMIC_EVENT',
    'DEVICE_INTEGRITY',
  ]),
  startedAt: z.string().min(1),
  endedAt: z.string().min(1),
  observedValue: z.number(),
  baselineValue: z.number(),
  confidence: z.number().min(0).max(1).optional(),
})

export const eventIngestionSchema = z.object({
  signals: z.array(flagSignalSchema).min(1),
})

export const disputeSubmissionSchema = z.object({
  flagId: z.string().min(1),
  reason: z.string().min(1),
  context: z.string().optional(),
})

export const disputeReviewSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reasoning: z.string().min(1),
})

export const stateTransitionSchema = z.object({
  toState: z.enum([
    'PENDING',
    'IDENTITY_VERIFIED',
    'IN_PROGRESS',
    'FLAGGED',
    'COMPLETED',
    'INCOMPLETE',
  ]),
  reason: z.string().optional(),
})

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string }

/** Validate `data` against `schema`, returning a discriminated result. */
export function validate<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)
  if (result.success) return { ok: true, data: result.data }
  const error = result.error.issues
    .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
    .join('; ')
  return { ok: false, error }
}
