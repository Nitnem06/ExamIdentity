// Category B — neutral evidence escrow service (Phase 4).
//
// Exam integrity evidence is encrypted under a key derived from BOTH the
// student key and the platform key (dual control), stored for 90 days, then
// deleted. Neither party can unilaterally decrypt the evidence.

import { randomUUID } from 'node:crypto'
import { deriveEscrowKey, encrypt } from '@examidentity/crypto-utils'
import { config } from '../../config'
import { escrowRepository } from '../../data'
import type { StudentRecord } from '../../data'

const RETENTION_DAYS = 90

/** Encrypt and store an evidence payload for a session. Returns the escrow id. */
export async function storeEvidence(
  sessionRef: string,
  student: StudentRecord,
  payload: unknown,
): Promise<string> {
  // Dual-key: student public key + platform key. Neither alone can decrypt.
  const escrowKey = deriveEscrowKey(student.publicKey, config.platformEncryptionKey)
  const encrypted = encrypt(JSON.stringify(payload), escrowKey)

  const escrowId = `esc-${randomUUID().slice(0, 12)}`
  const expiresAt = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await escrowRepository.create({
    escrowId,
    sessionRef,
    encryptedPayload: JSON.stringify(encrypted),
    studentKeyRef: student.did,
    platformKeyRef: config.platformDid,
    expiresAt,
  })

  return escrowId
}

/** Delete (scrub) all evidence past its retention window. Returns deleted ids. */
export async function deleteExpiredEvidence(): Promise<string[]> {
  return escrowRepository.deleteExpired()
}

export const retentionDays = RETENTION_DAYS
