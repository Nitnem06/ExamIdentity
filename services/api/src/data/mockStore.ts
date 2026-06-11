// In-memory mock repository implementation (async).
//
// Implements the same SessionRepository / CredentialRepository contracts as the
// Postgres implementation, so it can be selected via config.dataSource=mock to
// run the API with no database.

import type {
  CredentialRecord,
  CredentialRepository,
  DisputeRecord,
  DisputeRepository,
  DisputeResolution,
  EscrowRecord,
  EscrowRepository,
  FlagRecord,
  FlagRepository,
  NewDispute,
  NewEscrow,
  NewFlag,
  NewSession,
  NewStudent,
  SessionRecord,
  SessionRepository,
  StudentRecord,
  StudentRepository,
  UniversityRecord,
  UniversityRepository,
} from './types'

// ---- Fixtures -------------------------------------------------------------

const SESSIONS: SessionRecord[] = [
  {
    sessionId: 'sess-001',
    examId: 'exam-calculus-ii',
    examName: 'Calculus II — Final',
    studentDid: 'did:key:zDemoStudent',
    universityId: 'univ-demo',
    state: 'COMPLETED',
    accommodation: 'NONE',
    integrityScoreBand: 'HIGH',
    startedAt: '2026-06-10T10:00:00Z',
    completedAt: '2026-06-10T12:00:00Z',
  },
  {
    sessionId: 'sess-002',
    examId: 'exam-data-structures',
    examName: 'Data Structures — Midterm',
    studentDid: 'did:key:zDemoStudent',
    universityId: 'univ-demo',
    state: 'COMPLETED',
    accommodation: 'SCREEN_READER',
    integrityScoreBand: 'HIGH',
    startedAt: '2026-05-02T09:00:00Z',
    completedAt: '2026-05-02T10:30:00Z',
  },
]

const CREDENTIALS: CredentialRecord[] = [
  {
    status: 'ACTIVE',
    credentialHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00',
    credential: {
      id: 'cred-001',
      type: ['VerifiableCredential', 'ExamIntegrityCredential'],
      issuer: 'did:key:zUniversityDemo',
      issuanceDate: '2026-06-10T12:05:00Z',
      credentialSubject: {
        id: 'did:key:zDemoStudent',
        examName: 'Calculus II — Final',
        issuingInstitution: 'Demo University',
        institutionDid: 'did:key:zUniversityDemo',
        completedAt: '2026-06-10T12:00:00Z',
        integrityScoreBand: 'HIGH',
        flagCount: 1,
        disputeStatus: 'NOT_DISPUTED',
        sessionReference: 'sess-001',
      },
    },
  },
  {
    status: 'ACTIVE',
    credentialHash: '0f1e2d3c4b5a69788796a5b4c3d2e1f00fedcba9876543210011223344556677',
    credential: {
      id: 'cred-002',
      type: ['VerifiableCredential', 'ExamIntegrityCredential'],
      issuer: 'did:key:zUniversityDemo',
      issuanceDate: '2026-05-02T10:35:00Z',
      credentialSubject: {
        id: 'did:key:zDemoStudent',
        examName: 'Data Structures — Midterm',
        issuingInstitution: 'Demo University',
        institutionDid: 'did:key:zUniversityDemo',
        completedAt: '2026-05-02T10:30:00Z',
        integrityScoreBand: 'HIGH',
        flagCount: 0,
        disputeStatus: 'NOT_DISPUTED',
        sessionReference: 'sess-002',
      },
    },
  },
]

// ---- Async repository implementations -------------------------------------

export const mockSessionRepository: SessionRepository = {
  async list() {
    return [...SESSIONS]
  },
  async findById(sessionId) {
    return SESSIONS.find((s) => s.sessionId === sessionId)
  },
  async create(input: NewSession) {
    const record: SessionRecord = { ...input }
    SESSIONS.push(record)
    return record
  },
  async updateState(sessionId, state, stamps) {
    const record = SESSIONS.find((s) => s.sessionId === sessionId)
    if (!record) return undefined
    record.state = state
    if (stamps?.startedAt) record.startedAt = stamps.startedAt
    if (stamps?.completedAt) record.completedAt = stamps.completedAt
    return record
  },
}

export const mockCredentialRepository: CredentialRepository = {
  async list() {
    return [...CREDENTIALS]
  },
  async findById(credentialId) {
    return CREDENTIALS.find((c) => c.credential.id === credentialId)
  },
  async findByStudent(studentDid) {
    return CREDENTIALS.filter((c) => c.credential.credentialSubject.id === studentDid)
  },
  async create(input) {
    const record: CredentialRecord = {
      credential: input.credential,
      credentialHash: input.credentialHash,
      status: input.status ?? 'ACTIVE',
    }
    CREDENTIALS.push(record)
    return record
  },
}

// ---- Identity fixtures + repositories -------------------------------------

const UNIVERSITIES: UniversityRecord[] = [
  {
    universityId: 'univ-demo',
    name: 'Demo University',
    did: 'did:key:zUniversityDemo',
    createdAt: '2026-01-01T00:00:00Z',
  },
]

const STUDENTS: StudentRecord[] = [
  {
    did: 'did:key:zDemoStudent',
    universityId: 'univ-demo',
    universityDid: 'did:key:zUniversityDemo',
    publicKey: 'zDemoPublicKeyPlaceholder',
    encryptedKey: null,
    custodyTier: 'SELF_CUSTODY',
    accommodation: 'NONE',
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
]

export const mockUniversityRepository: UniversityRepository = {
  async list() {
    return [...UNIVERSITIES]
  },
  async findById(universityId) {
    return UNIVERSITIES.find((u) => u.universityId === universityId)
  },
}

export const mockStudentRepository: StudentRepository = {
  async create(input: NewStudent) {
    const now = new Date().toISOString()
    const record: StudentRecord = { ...input, createdAt: now, updatedAt: now }
    STUDENTS.push(record)
    return record
  },
  async findByDid(did) {
    return STUDENTS.find((s) => s.did === did)
  },
}

// ---- Flag / escrow / dispute in-memory stores -----------------------------

const FLAGS: FlagRecord[] = []
const ESCROWS: Array<EscrowRecord & { encryptedPayload: string }> = []
const DISPUTES: DisputeRecord[] = []

export const mockFlagRepository: FlagRepository = {
  async create(input: NewFlag) {
    const record: FlagRecord = {
      ...input,
      disputeStatus: input.disputeStatus ?? 'NOT_DISPUTED',
    }
    FLAGS.push(record)
    return record
  },
  async listBySession(sessionRef) {
    return FLAGS.filter((f) => f.sessionRef === sessionRef)
  },
  async findById(flagId) {
    return FLAGS.find((f) => f.flagId === flagId)
  },
  async updateDisputeStatus(flagId, disputeStatus) {
    const f = FLAGS.find((x) => x.flagId === flagId)
    if (f) f.disputeStatus = disputeStatus
  },
}

export const mockEscrowRepository: EscrowRepository = {
  async create(input: NewEscrow) {
    const record: EscrowRecord & { encryptedPayload: string } = {
      escrowId: input.escrowId,
      sessionRef: input.sessionRef,
      studentKeyRef: input.studentKeyRef,
      platformKeyRef: input.platformKeyRef,
      createdAt: new Date().toISOString(),
      expiresAt: input.expiresAt,
      encryptedPayload: input.encryptedPayload,
    }
    ESCROWS.push(record)
    return record
  },
  async deleteExpired(now = new Date().toISOString()) {
    const deleted: string[] = []
    for (const e of ESCROWS) {
      if (!e.deletedAt && e.expiresAt < now) {
        e.deletedAt = now
        e.encryptedPayload = ''
        deleted.push(e.escrowId)
      }
    }
    return deleted
  },
  async countActive() {
    return ESCROWS.filter((e) => !e.deletedAt).length
  },
}

export const mockDisputeRepository: DisputeRepository = {
  async create(input: NewDispute) {
    const record: DisputeRecord = { ...input, createdAt: new Date().toISOString() }
    DISPUTES.push(record)
    return record
  },
  async findById(disputeId) {
    return DISPUTES.find((d) => d.disputeId === disputeId)
  },
  async resolve(disputeId, resolution: DisputeResolution) {
    const d = DISPUTES.find((x) => x.disputeId === disputeId)
    if (!d) return undefined
    d.status = resolution.status
    if (resolution.tier !== undefined) d.tier = resolution.tier
    if (resolution.reviewerId) d.reviewerId = resolution.reviewerId
    if (resolution.reviewerReasoning) d.reviewerReasoning = resolution.reviewerReasoning
    d.resolvedAt = resolution.resolvedAt ?? new Date().toISOString()
    return d
  },
}
