// Dispute pipeline (Phase 5).
//
// submit -> AI triage (scoring service) -> auto-resolve OR escalate to tier-2
// reviewer -> optional tier-3 panel. Each step updates the flag's dispute
// status and appends a transparency-log entry.

import { randomUUID } from 'node:crypto'
import type {
  DisputeDecision,
  Dispute as SharedDispute,
  DisputeReview,
  DisputeSubmission,
} from '@examidentity/shared-types'
import { config } from '../../config'
import { disputeRepository, flagRepository } from '../../data'
import type { DisputeRecord, FlagRecord } from '../../data'
import { appendLogEntry } from '../transparency/logService'

export class DisputeError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message)
    this.name = 'DisputeError'
  }
}

interface Triage {
  recommendation: DisputeDecision
  confidence: number
  reasoning: string
}

/** Ask the scoring service for a first-pass recommendation; fall back locally. */
async function triage(flag: FlagRecord, submission: DisputeSubmission): Promise<Triage> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(`${config.scoringServiceUrl}/api/dispute/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        flagId: flag.flagId,
        reason: submission.reason,
        context: submission.context,
        autoResolved: flag.autoResolved,
        severity: flag.severity,
      }),
    })
    clearTimeout(timeout)
    if (res.ok) {
      const data = (await res.json()) as Triage
      return data
    }
  } catch {
    // fall through
  }
  // Local fallback heuristic.
  if (flag.autoResolved || flag.severity === 'LOW') {
    return { recommendation: 'APPROVE', confidence: 0.92, reasoning: 'Low severity / auto-resolved.' }
  }
  if (flag.severity === 'CRITICAL') {
    return { recommendation: 'ESCALATE', confidence: 0.61, reasoning: 'Critical severity needs panel review.' }
  }
  return { recommendation: 'REJECT', confidence: 0.7, reasoning: 'Evidence exceeds the adjusted threshold.' }
}

const AUTO_RESOLVE_THRESHOLD = 0.8

export async function submitDispute(
  studentDid: string,
  submission: DisputeSubmission,
): Promise<DisputeRecord> {
  if (!submission.flagId || !submission.reason) {
    throw new DisputeError('flagId and reason are required', 400)
  }
  const flag = await flagRepository.findById(submission.flagId)
  if (!flag) throw new DisputeError(`Flag not found: ${submission.flagId}`, 404)

  const rec = await triage(flag, submission)
  const disputeId = `disp-${randomUUID().slice(0, 8)}`

  const autoApprove =
    rec.recommendation === 'APPROVE' && rec.confidence >= AUTO_RESOLVE_THRESHOLD

  const dispute = await disputeRepository.create({
    disputeId,
    flagId: flag.flagId,
    studentDid,
    reason: submission.reason,
    context: submission.context,
    tier: 1,
    status: autoApprove ? 'AUTO_RESOLVED' : 'PENDING',
    aiRecommendation: rec.recommendation,
    aiConfidence: rec.confidence,
  })

  if (autoApprove) {
    await disputeRepository.resolve(disputeId, {
      status: 'AUTO_RESOLVED',
      resolvedAt: new Date().toISOString(),
    })
    await flagRepository.updateDisputeStatus(flag.flagId, 'AUTO_RESOLVED')
    await appendLogEntry({
      entryType: 'DISPUTE_AUTO_RESOLVED',
      studentDid,
      metadata: { disputeId, flagId: flag.flagId, confidence: rec.confidence },
    })
  } else {
    await flagRepository.updateDisputeStatus(flag.flagId, 'DISPUTED')
    await appendLogEntry({
      entryType: 'DISPUTE_SUBMITTED',
      studentDid,
      metadata: { disputeId, flagId: flag.flagId },
    })
  }

  return (await disputeRepository.findById(disputeId)) ?? dispute
}

async function resolveAtTier(
  disputeId: string,
  reviewerId: string,
  review: DisputeReview,
  tier: 2 | 3,
): Promise<DisputeRecord> {
  const dispute = await disputeRepository.findById(disputeId)
  if (!dispute) throw new DisputeError(`Dispute not found: ${disputeId}`, 404)
  if (dispute.status !== 'PENDING') {
    throw new DisputeError(`Dispute already resolved (${dispute.status})`, 409)
  }
  if (!review.decision || !review.reasoning) {
    throw new DisputeError('decision and reasoning are required', 400)
  }

  const approved = review.decision === 'APPROVE'
  const status =
    tier === 2
      ? approved
        ? 'TIER2_APPROVED'
        : 'TIER2_REJECTED'
      : approved
        ? 'PANEL_APPROVED'
        : 'PANEL_REJECTED'

  const updated = await disputeRepository.resolve(disputeId, {
    status,
    tier,
    reviewerId,
    reviewerReasoning: review.reasoning,
    resolvedAt: new Date().toISOString(),
  })
  await flagRepository.updateDisputeStatus(dispute.flagId, status)
  await appendLogEntry({
    entryType: tier === 2 ? 'DISPUTE_TIER2_RESOLVED' : 'DISPUTE_PANEL_RESOLVED',
    studentDid: dispute.studentDid,
    metadata: { disputeId, flagId: dispute.flagId, decision: review.decision },
  })
  return updated ?? dispute
}

export function reviewDispute(disputeId: string, reviewerId: string, review: DisputeReview) {
  return resolveAtTier(disputeId, reviewerId, review, 2)
}

export function panelDispute(disputeId: string, reviewerId: string, review: DisputeReview) {
  return resolveAtTier(disputeId, reviewerId, review, 3)
}

/** Narrow internal record to the shared Dispute shape (currently identical). */
export function toSharedDispute(record: DisputeRecord): SharedDispute {
  return record as unknown as SharedDispute
}
