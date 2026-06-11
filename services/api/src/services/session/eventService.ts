// Behavioral event ingestion (Phase 4).
//
// Pipeline: raw signals -> explainable flags (scoring service) -> persist flags
// -> store raw evidence in neutral dual-key escrow -> flag the session if
// needed -> append a transparency-log entry.

import { randomUUID } from 'node:crypto'
import type {
  AccommodationType,
  EventIngestionRequest,
  EventIngestionResult,
} from '@examidentity/shared-types'
import { flagRepository, sessionRepository, studentRepository } from '../../data'
import { getExplanationsForSignals } from './flagExplanationService'
import { storeEvidence } from '../escrow/escrowService'
import { SessionError, transitionSession } from './sessionService'
import { appendLogEntry } from '../transparency/logService'

export async function ingestEvents(
  sessionRef: string,
  request: EventIngestionRequest,
): Promise<EventIngestionResult> {
  const session = await sessionRepository.findById(sessionRef)
  if (!session) throw new SessionError(`Session not found: ${sessionRef}`, 404)

  const student = await studentRepository.findByDid(session.studentDid)
  if (!student) throw new SessionError('Student not found for session', 404)

  const signals = request.signals ?? []
  if (signals.length === 0) throw new SessionError('No signals provided', 400)

  const accommodation = (session.accommodation as AccommodationType) ?? 'NONE'
  const explained = await getExplanationsForSignals(
    sessionRef,
    session.studentDid,
    session.examId,
    accommodation,
    signals,
  )

  // Store the raw evidence in neutral, dual-key escrow (Category B).
  const escrowId = await storeEvidence(sessionRef, student, {
    signals,
    generatedAt: explained.generatedAt,
  })

  // Persist a flag per explanation (assign a stable unique flag id).
  let autoResolved = 0
  for (const ex of explained.explanations) {
    const flagId = `flag-${randomUUID().slice(0, 8)}`
    ex.flagId = flagId
    if (ex.autoResolved) autoResolved++
    await flagRepository.create({
      flagId,
      sessionRef,
      type: ex.type,
      severity: ex.severity,
      timestampInExam: ex.timeRange.startedAt,
      durationSeconds: ex.timeRange.durationSeconds,
      explanation: ex.summary,
      autoResolved: ex.autoResolved,
      disputeStatus: 'NOT_DISPUTED',
    })
  }

  // If there are actionable (non-auto-resolved) flags, mark the session FLAGGED.
  const actionable = explained.explanations.length - autoResolved
  if (actionable > 0 && session.state === 'IN_PROGRESS') {
    try {
      await transitionSession(sessionRef, 'FLAGGED')
    } catch {
      // ignore illegal transition (e.g. already terminal)
    }
  }

  await appendLogEntry({
    entryType: 'BEHAVIORAL_EVENTS_INGESTED',
    studentDid: session.studentDid,
    examId: session.examId,
    escrowId,
    metadata: { flags: explained.explanations.length, autoResolved },
  })

  return {
    sessionId: sessionRef,
    flagsCreated: explained.explanations.length,
    autoResolved,
    escrowId,
    explanations: explained.explanations,
  }
}
