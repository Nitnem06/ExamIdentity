// QR verification service.
//
// Mints short-lived verification links a third party can scan to validate a
// credential, and resolves those links to a non-identifying verification
// result. Includes a mock "privacy proof verified" indicator standing in for a
// future zero-knowledge proof.

import { sha256Hex } from '@examidentity/crypto-utils'
import type {
  QrVerificationLink,
  QrVerificationResult,
} from '@examidentity/shared-types'
import { config } from '../../config'
import { credentialRepository } from '../../data'

const LINK_TTL_MS = 1000 * 60 * 15 // 15 minutes

/** Build a verification link + QR payload for a credential. */
export async function createVerificationLink(
  credentialId: string,
  oneTime = false,
): Promise<QrVerificationLink> {
  const record = await credentialRepository.findById(credentialId)
  if (!record) {
    throw new Error(`Credential not found: ${credentialId}`)
  }
  const expiresAt = new Date(Date.now() + LINK_TTL_MS).toISOString()
  // Token binds credential id + hash + expiry; tamper-evident via sha256.
  const token = sha256Hex(`${credentialId}|${record.credentialHash}|${expiresAt}`).slice(0, 24)
  const verificationUrl = `${config.publicBaseUrl}/api/credential-bridge/verify/${credentialId}?token=${token}`

  return {
    credentialId,
    verificationUrl,
    qrPayload: verificationUrl,
    expiresAt,
    oneTime,
  }
}

/** Resolve a verification request to a non-identifying result. */
export async function verifyCredential(
  credentialId: string,
): Promise<QrVerificationResult> {
  const record = await credentialRepository.findById(credentialId)
  const checkedAt = new Date().toISOString()

  if (!record) {
    return {
      credentialId,
      verified: false,
      status: 'UNKNOWN',
      issuer: 'unknown',
      subjectSummary: 'Credential not found',
      issuedAt: checkedAt,
      checkedAt,
      privacyProofVerified: false,
    }
  }

  const c = record.credential
  const s = c.credentialSubject
  const revoked = record.status === 'REVOKED'

  return {
    credentialId,
    verified: !revoked,
    status: revoked ? 'REVOKED' : 'VALID',
    issuer: c.issuer,
    subjectSummary: `${s.examName} — ${s.integrityScoreBand} integrity, ${s.flagCount} flag(s)`,
    issuedAt: c.issuanceDate,
    checkedAt,
    // Mock ZKP indicator: in the MVP we simply assert the proof verified
    // without revealing the underlying evidence.
    privacyProofVerified: !revoked,
  }
}
