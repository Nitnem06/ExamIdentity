// Postgres-backed repository implementations.
//
// Queries the schema from infrastructure/db/init.sql (+ the columns added by
// infrastructure/db/seed.sql: exam_sessions.exam_name and
// exam_sessions.accommodation). Maps rows to the shared record types.

import type { ExamCredential } from '@examidentity/shared-types'
import { query } from './db'
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

interface SessionRow {
  session_id: string
  exam_id: string
  exam_name: string | null
  student_did: string
  university_id: string
  state: string
  accommodation: string | null
  score_band: string | null
  started_at: Date | null
  completed_at: Date | null
}

function toIso(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString() : ''
}

function mapSession(row: SessionRow): SessionRecord {
  return {
    sessionId: row.session_id,
    examId: row.exam_id,
    examName: row.exam_name ?? row.exam_id,
    studentDid: row.student_did,
    universityId: row.university_id,
    state: row.state,
    accommodation: row.accommodation ?? 'NONE',
    integrityScoreBand: (row.score_band as SessionRecord['integrityScoreBand']) ?? undefined,
    startedAt: row.started_at ? toIso(row.started_at) : undefined,
    completedAt: row.completed_at ? toIso(row.completed_at) : undefined,
  }
}

const SESSION_SELECT = `
  SELECT s.session_id, s.exam_id, s.exam_name, s.student_did, s.university_id,
         s.state, s.accommodation, s.score_band, s.started_at, s.completed_at
  FROM exam_sessions s
`

export const pgSessionRepository: SessionRepository = {
  async list() {
    const rows = await query<SessionRow>(`${SESSION_SELECT} ORDER BY s.created_at`)
    return rows.map(mapSession)
  },
  async findById(sessionId) {
    const rows = await query<SessionRow>(`${SESSION_SELECT} WHERE s.session_id = $1`, [
      sessionId,
    ])
    return rows[0] ? mapSession(rows[0]) : undefined
  },
  async create(input: NewSession) {
    const rows = await query<SessionRow>(
      `INSERT INTO exam_sessions
         (session_id, exam_id, exam_name, student_did, university_id, state, accommodation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING session_id, exam_id, exam_name, student_did, university_id,
                 state, accommodation, score_band, started_at, completed_at`,
      [
        input.sessionId,
        input.examId,
        input.examName,
        input.studentDid,
        input.universityId,
        input.state,
        input.accommodation,
      ],
    )
    return mapSession(rows[0])
  },
  async updateState(sessionId, state, stamps) {
    const rows = await query<SessionRow>(
      `UPDATE exam_sessions
         SET state = $2,
             started_at = COALESCE($3, started_at),
             completed_at = COALESCE($4, completed_at)
       WHERE session_id = $1
       RETURNING session_id, exam_id, exam_name, student_did, university_id,
                 state, accommodation, score_band, started_at, completed_at`,
      [sessionId, state, stamps?.startedAt ?? null, stamps?.completedAt ?? null],
    )
    return rows[0] ? mapSession(rows[0]) : undefined
  },
}

interface CredentialRow {
  credential_json: ExamCredential
  credential_hash: string
  status: string
}

function mapCredential(row: CredentialRow): CredentialRecord {
  return {
    credential: row.credential_json,
    credentialHash: row.credential_hash,
    status: row.status === 'REVOKED' ? 'REVOKED' : 'ACTIVE',
  }
}

export const pgCredentialRepository: CredentialRepository = {
  async list() {
    const rows = await query<CredentialRow>(
      `SELECT credential_json, credential_hash, status FROM credentials ORDER BY issued_at`,
    )
    return rows.map(mapCredential)
  },
  async findById(credentialId) {
    // The credential id lives inside the JSONB document.
    const rows = await query<CredentialRow>(
      `SELECT credential_json, credential_hash, status
       FROM credentials
       WHERE credential_json->>'id' = $1
       LIMIT 1`,
      [credentialId],
    )
    return rows[0] ? mapCredential(rows[0]) : undefined
  },
}

// ---- Universities ---------------------------------------------------------

interface UniversityRow {
  university_id: string
  name: string
  did: string
  created_at: Date
}

export const pgUniversityRepository: UniversityRepository = {
  async list() {
    const rows = await query<UniversityRow>(
      `SELECT university_id, name, did, created_at FROM universities ORDER BY name`,
    )
    return rows.map((r) => ({
      universityId: r.university_id,
      name: r.name,
      did: r.did,
      createdAt: toIso(r.created_at),
    }))
  },
  async findById(universityId) {
    const rows = await query<UniversityRow>(
      `SELECT university_id, name, did, created_at FROM universities WHERE university_id = $1`,
      [universityId],
    )
    const r = rows[0]
    return r
      ? { universityId: r.university_id, name: r.name, did: r.did, createdAt: toIso(r.created_at) }
      : undefined
  },
}

// ---- Students -------------------------------------------------------------

interface StudentRow {
  did: string
  university_id: string
  university_did: string
  public_key: string
  encrypted_key: string | null
  custody_tier: string
  accommodation: string
  created_at: Date
  updated_at: Date
}

function mapStudent(row: StudentRow): StudentRecord {
  return {
    did: row.did,
    universityId: row.university_id,
    universityDid: row.university_did,
    publicKey: row.public_key,
    encryptedKey: row.encrypted_key,
    custodyTier: row.custody_tier === 'STANDARD' ? 'STANDARD' : 'SELF_CUSTODY',
    accommodation: row.accommodation,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

export const pgStudentRepository: StudentRepository = {
  async create(input: NewStudent) {
    const rows = await query<StudentRow>(
      `INSERT INTO students
         (did, university_id, university_did, encrypted_key, public_key, custody_tier, accommodation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING did, university_id, university_did, public_key, encrypted_key,
                 custody_tier, accommodation, created_at, updated_at`,
      [
        input.did,
        input.universityId,
        input.universityDid,
        input.encryptedKey,
        input.publicKey,
        input.custodyTier,
        input.accommodation,
      ],
    )
    return mapStudent(rows[0])
  },
  async findByDid(did) {
    const rows = await query<StudentRow>(
      `SELECT did, university_id, university_did, public_key, encrypted_key,
              custody_tier, accommodation, created_at, updated_at
       FROM students WHERE did = $1`,
      [did],
    )
    return rows[0] ? mapStudent(rows[0]) : undefined
  },
}


// ---- Flags (Phase 4) ------------------------------------------------------

interface FlagRow {
  flag_id: string
  session_ref: string
  flag_type: string
  severity: string
  timestamp_in_exam: Date
  duration_seconds: string | number | null
  explanation: string
  auto_resolved: boolean
  dispute_status: string
}

function mapFlag(row: FlagRow): FlagRecord {
  return {
    flagId: row.flag_id,
    sessionRef: row.session_ref,
    type: row.flag_type,
    severity: row.severity,
    timestampInExam: toIso(row.timestamp_in_exam),
    durationSeconds: row.duration_seconds == null ? undefined : Number(row.duration_seconds),
    explanation: row.explanation,
    autoResolved: row.auto_resolved,
    disputeStatus: row.dispute_status,
  }
}

export const pgFlagRepository: FlagRepository = {
  async create(input: NewFlag) {
    const rows = await query<FlagRow>(
      `INSERT INTO flags
         (flag_id, session_id, flag_type, severity, timestamp_in_exam,
          duration_seconds, explanation, auto_resolved, dispute_status)
       VALUES ($1, (SELECT id FROM exam_sessions WHERE session_id = $2), $3, $4, $5,
               $6, $7, $8, $9)
       RETURNING flag_id,
                 (SELECT session_id FROM exam_sessions WHERE id = flags.session_id) AS session_ref,
                 flag_type, severity, timestamp_in_exam, duration_seconds,
                 explanation, auto_resolved, dispute_status`,
      [
        input.flagId,
        input.sessionRef,
        input.type,
        input.severity,
        input.timestampInExam,
        input.durationSeconds ?? null,
        input.explanation,
        input.autoResolved,
        input.disputeStatus ?? 'NOT_DISPUTED',
      ],
    )
    return mapFlag(rows[0])
  },
  async listBySession(sessionRef) {
    const rows = await query<FlagRow>(
      `SELECT f.flag_id, s.session_id AS session_ref, f.flag_type, f.severity,
              f.timestamp_in_exam, f.duration_seconds, f.explanation,
              f.auto_resolved, f.dispute_status
       FROM flags f JOIN exam_sessions s ON s.id = f.session_id
       WHERE s.session_id = $1
       ORDER BY f.timestamp_in_exam`,
      [sessionRef],
    )
    return rows.map(mapFlag)
  },
  async findById(flagId) {
    const rows = await query<FlagRow>(
      `SELECT f.flag_id, s.session_id AS session_ref, f.flag_type, f.severity,
              f.timestamp_in_exam, f.duration_seconds, f.explanation,
              f.auto_resolved, f.dispute_status
       FROM flags f JOIN exam_sessions s ON s.id = f.session_id
       WHERE f.flag_id = $1`,
      [flagId],
    )
    return rows[0] ? mapFlag(rows[0]) : undefined
  },
  async updateDisputeStatus(flagId, disputeStatus) {
    await query(`UPDATE flags SET dispute_status = $2 WHERE flag_id = $1`, [
      flagId,
      disputeStatus,
    ])
  },
}

// ---- Evidence escrow (Phase 4) --------------------------------------------

interface EscrowRow {
  escrow_id: string
  session_ref: string
  student_key_ref: string
  platform_key_ref: string
  created_at: Date
  expires_at: Date
  deleted_at: Date | null
}

export const pgEscrowRepository: EscrowRepository = {
  async create(input: NewEscrow) {
    const rows = await query<EscrowRow>(
      `INSERT INTO evidence_escrow
         (escrow_id, session_id, encrypted_payload, student_key_ref, platform_key_ref, expires_at)
       VALUES ($1, (SELECT id FROM exam_sessions WHERE session_id = $2), $3, $4, $5, $6)
       RETURNING escrow_id,
                 (SELECT session_id FROM exam_sessions WHERE id = evidence_escrow.session_id) AS session_ref,
                 student_key_ref, platform_key_ref, created_at, expires_at, deleted_at`,
      [
        input.escrowId,
        input.sessionRef,
        input.encryptedPayload,
        input.studentKeyRef,
        input.platformKeyRef,
        input.expiresAt,
      ],
    )
    const r = rows[0]
    return {
      escrowId: r.escrow_id,
      sessionRef: r.session_ref,
      studentKeyRef: r.student_key_ref,
      platformKeyRef: r.platform_key_ref,
      createdAt: toIso(r.created_at),
      expiresAt: toIso(r.expires_at),
      deletedAt: r.deleted_at ? toIso(r.deleted_at) : undefined,
    }
  },
  async deleteExpired(now = new Date().toISOString()) {
    // Scrub the encrypted payload and stamp deletion for anything past expiry.
    const rows = await query<{ escrow_id: string }>(
      `UPDATE evidence_escrow
         SET deleted_at = NOW(), encrypted_payload = ''
       WHERE expires_at < $1 AND deleted_at IS NULL
       RETURNING escrow_id`,
      [now],
    )
    return rows.map((r) => r.escrow_id)
  },
  async countActive() {
    const rows = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM evidence_escrow WHERE deleted_at IS NULL`,
    )
    return Number(rows[0]?.count ?? 0)
  },
}

// ---- Disputes (Phase 5) ---------------------------------------------------

interface DisputeRow {
  dispute_id: string
  flag_id: string
  student_did: string
  reason: string
  context: string | null
  tier: number
  status: string
  ai_recommendation: string | null
  ai_confidence: string | number | null
  reviewer_id: string | null
  reviewer_reasoning: string | null
  resolved_at: Date | null
  created_at: Date
}

function mapDispute(row: DisputeRow): DisputeRecord {
  return {
    disputeId: row.dispute_id,
    flagId: row.flag_id,
    studentDid: row.student_did,
    reason: row.reason,
    context: row.context ?? undefined,
    tier: row.tier,
    status: row.status,
    aiRecommendation: row.ai_recommendation ?? undefined,
    aiConfidence: row.ai_confidence == null ? undefined : Number(row.ai_confidence),
    reviewerId: row.reviewer_id ?? undefined,
    reviewerReasoning: row.reviewer_reasoning ?? undefined,
    resolvedAt: row.resolved_at ? toIso(row.resolved_at) : undefined,
    createdAt: toIso(row.created_at),
  }
}

const DISPUTE_COLS = `dispute_id, flag_id, student_did, reason, context, tier, status,
  ai_recommendation, ai_confidence, reviewer_id, reviewer_reasoning, resolved_at, created_at`

export const pgDisputeRepository: DisputeRepository = {
  async create(input: NewDispute) {
    const rows = await query<DisputeRow>(
      `INSERT INTO disputes
         (dispute_id, flag_id, student_did, reason, context, tier, status,
          ai_recommendation, ai_confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${DISPUTE_COLS}`,
      [
        input.disputeId,
        input.flagId,
        input.studentDid,
        input.reason,
        input.context ?? null,
        input.tier,
        input.status,
        input.aiRecommendation ?? null,
        input.aiConfidence ?? null,
      ],
    )
    return mapDispute(rows[0])
  },
  async findById(disputeId) {
    const rows = await query<DisputeRow>(
      `SELECT ${DISPUTE_COLS} FROM disputes WHERE dispute_id = $1`,
      [disputeId],
    )
    return rows[0] ? mapDispute(rows[0]) : undefined
  },
  async resolve(disputeId, resolution: DisputeResolution) {
    const rows = await query<DisputeRow>(
      `UPDATE disputes
         SET status = $2,
             tier = COALESCE($3, tier),
             reviewer_id = COALESCE($4, reviewer_id),
             reviewer_reasoning = COALESCE($5, reviewer_reasoning),
             resolved_at = COALESCE($6, resolved_at)
       WHERE dispute_id = $1
       RETURNING ${DISPUTE_COLS}`,
      [
        disputeId,
        resolution.status,
        resolution.tier ?? null,
        resolution.reviewerId ?? null,
        resolution.reviewerReasoning ?? null,
        resolution.resolvedAt ?? new Date().toISOString(),
      ],
    )
    return rows[0] ? mapDispute(rows[0]) : undefined
  },
}
