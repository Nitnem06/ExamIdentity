// Credential issuance service (Phase 6).
//
// On exam completion, issues a W3C Verifiable Credential summarizing the
// session's integrity outcome, signs it (Ed25519), persists it, and appends a
// CREDENTIAL_ISSUED transparency-log entry.

import { randomUUID } from 'node:crypto'
import { generateKeyPair, publicKeyToDidKey, sha256Hex, sign } from '@examidentity/crypto-utils'
import type { ExamCredential } from '@examidentity/shared-types'
import { config } from '../../config'
import {
  credentialRepository,
  flagRepository,
  sessionRepository,
  universityRepository,
} from '../../data'
import type { FlagRecord, SessionRecord } from '../../data'
import { appendLogEntry } from '../transparency/logService'

// Platform signing key: use the configured key if present, else an ephemeral
// one generated at boot (fine for the MVP; replace with a managed key later).
const platformKey = (() => {
  if (config.platformPrivateKey) {
    // Public key is derived lazily on first sign; we only need the private hex.
    return { privateKeyHex: config.platformPrivateKey, publicKeyHex: '' }
  }
  const kp = generateKeyPair()
  return { privateKeyHex: kp.privateKeyHex, publicKeyHex: kp.publicKeyHex }
})()

/** Derive an integrity band from the session's actionable flags. */
function bandFromFlags(flags: FlagRecord[]): 'HIGH' | 'MEDIUM' | 'LOW' {
  const actionable = flags.filter((f) => !f.autoResolved)
  if (actionable.some((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')) return 'LOW'
  if (actionable.length > 0) return 'MEDIUM'
  return 'HIGH'
}

function buildCredential(
  session: SessionRecord,
  institutionDid: string,
  institutionName: string,
  band: 'HIGH' | 'MEDIUM' | 'LOW',
  flagCount: number,
): ExamCredential {
  return {
    id: `cred-${randomUUID().slice(0, 8)}`,
    type: ['VerifiableCredential', 'ExamIntegrityCredential'],
    issuer: institutionDid,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: session.studentDid,
      examName: session.examName,
      issuingInstitution: institutionName,
      institutionDid,
      completedAt: session.completedAt ?? new Date().toISOString(),
      integrityScoreBand: band,
      flagCount,
      disputeStatus: 'NOT_DISPUTED',
      sessionReference: session.sessionId,
    },
  }
}

/**
 * Issue a credential for a completed session. Idempotent-ish: re-issuing for a
 * session simply mints another credential (terminal state guards prevent this
 * in normal flow).
 */
export async function issueCredentialForSession(
  sessionId: string,
): Promise<ExamCredential | undefined> {
  const session = await sessionRepository.findById(sessionId)
  if (!session) return undefined

  const university = await universityRepository.findById(session.universityId)
  const institutionDid = university?.did ?? config.platformDid
  const institutionName = university?.name ?? 'Unknown Institution'

  const flags = await flagRepository.listBySession(sessionId)
  const band = bandFromFlags(flags)

  const credential = buildCredential(session, institutionDid, institutionName, band, flags.length)

  // Sign the canonical credential (without proof) and attach an Ed25519 proof.
  const canonical = JSON.stringify(credential)
  const signature = sign(canonical, platformKey.privateKeyHex)
  const verificationMethod = platformKey.publicKeyHex
    ? publicKeyToDidKey(platformKey.publicKeyHex)
    : config.platformDid
  credential.proof = {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    verificationMethod: `${verificationMethod}#keys-1`,
    proofPurpose: 'assertionMethod',
    proofValue: signature,
  }

  const credentialHash = sha256Hex(canonical)
  await credentialRepository.create({ credential, credentialHash, status: 'ACTIVE' })

  await appendLogEntry({
    entryType: 'CREDENTIAL_ISSUED',
    studentDid: session.studentDid,
    examId: session.examId,
    metadata: { credentialId: credential.id, band, flagCount: flags.length },
  })

  return credential
}
