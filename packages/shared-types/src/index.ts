// Credential Types
import type { FlagExplanation } from './explanations'

export interface ExamCredential {
  id: string
  type: string[]
  issuer: string
  issuanceDate: string
  credentialSubject: {
    id: string
    examName: string
    issuingInstitution: string
    institutionDid: string
    completedAt: string
    integrityScoreBand: 'HIGH' | 'MEDIUM' | 'LOW'
    flagCount: number
    disputeStatus: string
    sessionReference: string
  }
  proof?: object
}

// Session Types
export interface ExamSession {
  sessionId: string
  examId: string
  studentDid: string
  state: SessionState
  startedAt: string
  completedAt?: string
  integrityScore?: number
  flags: ExamFlag[]
}

export type SessionState =
  | 'PENDING'
  | 'IDENTITY_VERIFIED'
  | 'IN_PROGRESS'
  | 'FLAGGED'
  | 'COMPLETED'
  | 'INCOMPLETE'

/** Request to create a new exam session. */
export interface CreateSessionRequest {
  examId: string
  examName?: string
  /** Required when a university creates a session on a student's behalf. */
  studentDid?: string
  /** Optional accommodation override (defaults to the student's profile). */
  accommodation?: string
}

/** Request to explicitly transition a session to a new state. */
export interface SessionStateTransitionRequest {
  toState: SessionState
  reason?: string
}

// Flag Types
export interface ExamFlag {
  flagId: string
  sessionId: string
  type: FlagType
  severity: FlagSeverity
  timestamp: string
  durationSeconds?: number
  explanation: string
  autoResolved: boolean
  disputeStatus?: DisputeStatus
}

export type FlagType =
  | 'GAZE_AWAY'
  | 'TYPING_IDENTITY_DRIFT'
  | 'MULTIPLE_VOICES'
  | 'SYSTEMIC_EVENT'
  | 'DEVICE_INTEGRITY'

export type FlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type DisputeStatus =
  | 'NOT_DISPUTED'
  | 'DISPUTED'
  | 'AUTO_RESOLVED'
  | 'TIER2_APPROVED'
  | 'TIER2_REJECTED'
  | 'PANEL_APPROVED'
  | 'PANEL_REJECTED'

// Biometric Types
export interface BehavioralVector {
  timestamp: string
  gazeOnScreen: boolean
  gazeVector: [number, number, number]
  attentionScore: number
  offScreenDurationAccumulated: number
}

export interface KeystrokeBatch {
  batchId: number
  timestamp: string
  typingSimilarityToBaseline: number
  rhythmConsistency: number
  wordsPerMinute: number
}

// Transparency Log Types
export interface TransparencyLogEntry {
  id: number
  entryHash: string
  prevHash: string
  treeHash: string
  timestamp: string
  entryType: LogEntryType
  metadata: Record<string, string>
}

export type LogEntryType =
  | 'ENROLLMENT_CREATED'
  | 'EXAM_ACKNOWLEDGED'
  | 'EXAM_SESSION_STARTED'
  | 'EXAM_SESSION_COMPLETED'
  | 'DISPUTE_SUBMITTED'
  | 'DISPUTE_AUTO_RESOLVED'
  | 'DISPUTE_TIER2_RESOLVED'
  | 'DISPUTE_PANEL_RESOLVED'
  | 'CREDENTIAL_ISSUED'
  | 'CREDENTIAL_REVOKED'

// Feature domain types
export * from './explanations'
export * from './transparency'
export * from './credentialBridge'
export * from './identity'

// ---- Behavioral event ingestion (Phase 4) --------------------------------

/** A raw behavioural signal submitted during an exam. */
export interface FlagSignalInput {
  type: FlagType
  startedAt: string
  endedAt: string
  observedValue: number
  baselineValue: number
  confidence?: number
}

/** Request body for POST /api/sessions/:id/events. */
export interface EventIngestionRequest {
  signals: FlagSignalInput[]
}

/** Result of ingesting behavioural events. */
export interface EventIngestionResult {
  sessionId: string
  flagsCreated: number
  autoResolved: number
  /** Escrow id holding the dual-key-encrypted evidence for this batch. */
  escrowId: string
  explanations: FlagExplanation[]
}

// ---- Disputes (Phase 5) ---------------------------------------------------

export type DisputeDecision = 'APPROVE' | 'REJECT' | 'ESCALATE'

/** Student-submitted dispute of a flag. */
export interface DisputeSubmission {
  flagId: string
  reason: string
  context?: string
}

/** Reviewer (tier-2) or panel (tier-3) decision. */
export interface DisputeReview {
  decision: 'APPROVE' | 'REJECT'
  reasoning: string
}

/** Persisted dispute record. */
export interface Dispute {
  disputeId: string
  flagId: string
  studentDid: string
  reason: string
  context?: string
  tier: number
  status: DisputeStatus
  aiRecommendation?: DisputeDecision
  aiConfidence?: number
  reviewerId?: string
  reviewerReasoning?: string
  resolvedAt?: string
  createdAt: string
}
