// Exam session lifecycle service (Phase 3).
//
// Owns session creation and a guarded state machine:
//   PENDING -> IDENTITY_VERIFIED -> IN_PROGRESS -> (FLAGGED) -> COMPLETED
//   any active state -> INCOMPLETE
// Terminal states (COMPLETED / INCOMPLETE) allow no further transitions.

import { randomUUID } from 'node:crypto'
import type { SessionState } from '@examidentity/shared-types'
import { sessionRepository, studentRepository } from '../../data'
import type { SessionRecord } from '../../data'

const ALLOWED: Record<SessionState, SessionState[]> = {
  PENDING: ['IDENTITY_VERIFIED', 'INCOMPLETE'],
  IDENTITY_VERIFIED: ['IN_PROGRESS', 'INCOMPLETE'],
  IN_PROGRESS: ['FLAGGED', 'COMPLETED', 'INCOMPLETE'],
  FLAGGED: ['IN_PROGRESS', 'COMPLETED', 'INCOMPLETE'],
  COMPLETED: [],
  INCOMPLETE: [],
}

export class SessionError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message)
    this.name = 'SessionError'
  }
}

export async function createSession(
  studentDid: string,
  examId: string,
  examName?: string,
  accommodationOverride?: string,
): Promise<SessionRecord> {
  const student = await studentRepository.findByDid(studentDid)
  if (!student) {
    throw new SessionError(`Student not found: ${studentDid}`, 404)
  }
  const sessionId = `sess-${randomUUID().slice(0, 8)}`
  return sessionRepository.create({
    sessionId,
    examId,
    examName: examName ?? examId,
    studentDid,
    universityId: student.universityId,
    accommodation: accommodationOverride ?? student.accommodation,
    state: 'PENDING',
  })
}

export async function transitionSession(
  sessionId: string,
  toState: SessionState,
): Promise<SessionRecord> {
  const session = await sessionRepository.findById(sessionId)
  if (!session) {
    throw new SessionError(`Session not found: ${sessionId}`, 404)
  }
  const from = session.state as SessionState
  if (!(ALLOWED[from] ?? []).includes(toState)) {
    throw new SessionError(`Illegal transition: ${from} -> ${toState}`, 409)
  }

  const stamps: { startedAt?: string; completedAt?: string } = {}
  const now = new Date().toISOString()
  if (toState === 'IN_PROGRESS' && !session.startedAt) stamps.startedAt = now
  if (toState === 'COMPLETED' || toState === 'INCOMPLETE') stamps.completedAt = now

  const updated = await sessionRepository.updateState(sessionId, toState, stamps)
  if (!updated) {
    throw new SessionError(`Session not found: ${sessionId}`, 404)
  }
  return updated
}
