// Repository contracts shared by the mock and Postgres implementations.
// Routes and services depend only on these async interfaces, so the data
// source can be swapped via config without touching feature code.

import type { ExamCredential } from '@examidentity/shared-types'

export interface SessionRecord {
  sessionId: string
  examId: string
  examName: string
  studentDid: string
  universityId: string
  state: string
  accommodation: string
  /** Present once scored. */
  integrityScoreBand?: 'HIGH' | 'MEDIUM' | 'LOW'
  /** Present once the exam has started. */
  startedAt?: string
  completedAt?: string
}

export interface NewSession {
  sessionId: string
  examId: string
  examName: string
  studentDid: string
  universityId: string
  accommodation: string
  state: string
}

export interface CredentialRecord {
  credential: ExamCredential
  status: 'ACTIVE' | 'REVOKED'
  credentialHash: string
}

export interface NewCredential {
  credential: ExamCredential
  credentialHash: string
  status?: 'ACTIVE' | 'REVOKED'
}

export interface UniversityRecord {
  universityId: string
  name: string
  did: string
  createdAt: string
}

export interface StudentRecord {
  did: string
  universityId: string
  universityDid: string
  publicKey: string
  /** Encrypted private key for STANDARD custody; null for SELF_CUSTODY. */
  encryptedKey: string | null
  custodyTier: 'SELF_CUSTODY' | 'STANDARD'
  accommodation: string
  createdAt: string
  updatedAt: string
}

export interface NewStudent {
  did: string
  universityId: string
  universityDid: string
  publicKey: string
  encryptedKey: string | null
  custodyTier: 'SELF_CUSTODY' | 'STANDARD'
  accommodation: string
}

export interface SessionRepository {
  list(): Promise<SessionRecord[]>
  findById(sessionId: string): Promise<SessionRecord | undefined>
  create(input: NewSession): Promise<SessionRecord>
  /** Update state and optionally stamp started/completed timestamps. */
  updateState(
    sessionId: string,
    state: string,
    stamps?: { startedAt?: string; completedAt?: string },
  ): Promise<SessionRecord | undefined>
}

export interface CredentialRepository {
  list(): Promise<CredentialRecord[]>
  findById(credentialId: string): Promise<CredentialRecord | undefined>
  findByStudent(studentDid: string): Promise<CredentialRecord[]>
  create(input: NewCredential): Promise<CredentialRecord>
}

export interface UniversityRepository {
  list(): Promise<UniversityRecord[]>
  findById(universityId: string): Promise<UniversityRecord | undefined>
}

export interface StudentRepository {
  create(input: NewStudent): Promise<StudentRecord>
  findByDid(did: string): Promise<StudentRecord | undefined>
}

// ---- Flags (Phase 4) ------------------------------------------------------

export interface FlagRecord {
  flagId: string
  /** The exam_sessions.session_id string this flag belongs to. */
  sessionRef: string
  type: string
  severity: string
  timestampInExam: string
  durationSeconds?: number
  explanation: string
  autoResolved: boolean
  disputeStatus: string
}

export interface NewFlag {
  flagId: string
  sessionRef: string
  type: string
  severity: string
  timestampInExam: string
  durationSeconds?: number
  explanation: string
  autoResolved: boolean
  disputeStatus?: string
}

export interface FlagRepository {
  create(input: NewFlag): Promise<FlagRecord>
  listBySession(sessionRef: string): Promise<FlagRecord[]>
  findById(flagId: string): Promise<FlagRecord | undefined>
  updateDisputeStatus(flagId: string, disputeStatus: string): Promise<void>
}

// ---- Evidence escrow (Phase 4, Category B) --------------------------------

export interface EscrowRecord {
  escrowId: string
  sessionRef: string
  studentKeyRef: string
  platformKeyRef: string
  createdAt: string
  expiresAt: string
  deletedAt?: string
}

export interface NewEscrow {
  escrowId: string
  sessionRef: string
  encryptedPayload: string
  studentKeyRef: string
  platformKeyRef: string
  expiresAt: string
}

export interface EscrowRepository {
  create(input: NewEscrow): Promise<EscrowRecord>
  /** Mark all rows past their expiry as deleted; returns deleted escrow ids. */
  deleteExpired(now?: string): Promise<string[]>
  countActive(): Promise<number>
}

// ---- Disputes (Phase 5) ---------------------------------------------------

export interface DisputeRecord {
  disputeId: string
  flagId: string
  studentDid: string
  reason: string
  context?: string
  tier: number
  status: string
  aiRecommendation?: string
  aiConfidence?: number
  reviewerId?: string
  reviewerReasoning?: string
  resolvedAt?: string
  createdAt: string
}

export interface NewDispute {
  disputeId: string
  flagId: string
  studentDid: string
  reason: string
  context?: string
  tier: number
  status: string
  aiRecommendation?: string
  aiConfidence?: number
}

export interface DisputeResolution {
  status: string
  tier?: number
  reviewerId?: string
  reviewerReasoning?: string
  resolvedAt?: string
}

export interface DisputeRepository {
  create(input: NewDispute): Promise<DisputeRecord>
  findById(disputeId: string): Promise<DisputeRecord | undefined>
  resolve(disputeId: string, resolution: DisputeResolution): Promise<DisputeRecord | undefined>
}
