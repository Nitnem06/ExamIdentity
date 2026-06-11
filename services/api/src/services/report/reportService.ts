// University integrity report (Phase 6, Category C).
//
// Aggregates a student's sessions, flags, and credentials into an institutional
// report. Owned by the university; students cannot modify it.

import type { StudentIntegrityReport } from '@examidentity/shared-types'
import { credentialRepository, flagRepository, sessionRepository } from '../../data'

export async function getStudentReport(
  studentDid: string,
  universityId?: string,
): Promise<StudentIntegrityReport> {
  const allSessions = await sessionRepository.list()
  const sessions = allSessions.filter(
    (s) => s.studentDid === studentDid && (!universityId || s.universityId === universityId),
  )

  let totalFlags = 0
  let actionableFlags = 0
  const reportSessions = await Promise.all(
    sessions.map(async (s) => {
      const flags = await flagRepository.listBySession(s.sessionId)
      totalFlags += flags.length
      actionableFlags += flags.filter((f) => !f.autoResolved).length
      return {
        sessionId: s.sessionId,
        examId: s.examId,
        examName: s.examName,
        state: s.state,
        integrityScoreBand: s.integrityScoreBand,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        flagCount: flags.length,
        flags: flags.map((f) => ({
          flagId: f.flagId,
          type: f.type,
          severity: f.severity,
          disputeStatus: f.disputeStatus,
          autoResolved: f.autoResolved,
        })),
      }
    }),
  )

  const credentials = (await credentialRepository.findByStudent(studentDid)).map((c) => ({
    id: c.credential.id,
    examName: c.credential.credentialSubject.examName,
    integrityScoreBand: c.credential.credentialSubject.integrityScoreBand,
    status: c.status,
  }))

  return {
    studentDid,
    universityId: universityId ?? sessions[0]?.universityId ?? 'unknown',
    generatedAt: new Date().toISOString(),
    totals: {
      sessions: sessions.length,
      flags: totalFlags,
      actionableFlags,
      credentialsIssued: credentials.length,
    },
    sessions: reportSessions,
    credentials,
  }
}
