// Auth service — DID challenge/response login.
//
// A student proves control of their DID by signing a server-issued nonce with
// their Ed25519 private key. The server verifies the signature against the
// student's stored public key. Nonces are single-use and short-lived.
// (In-memory for the MVP; move to Redis for multi-instance deployments.)

import { randomBytes } from 'node:crypto'
import type { LoginChallenge } from '@examidentity/shared-types'
import { studentRepository } from '../data'
import { verifyMessage } from '../services/identity/didService'

interface NonceEntry {
  nonce: string
  expiresAt: number
}

const challenges = new Map<string, NonceEntry>()
const CHALLENGE_TTL_MS = 5 * 60 * 1000

/** Issue a login challenge (nonce) for a DID. */
export function createChallenge(did: string): LoginChallenge {
  const nonce = randomBytes(24).toString('hex')
  const expiresAt = Date.now() + CHALLENGE_TTL_MS
  challenges.set(did, { nonce, expiresAt })
  return { did, nonce, expiresAt: new Date(expiresAt).toISOString() }
}

/** Verify a signature over the outstanding nonce for `did`. Single-use. */
export async function verifyLogin(did: string, signature: string): Promise<boolean> {
  const entry = challenges.get(did)
  if (!entry || entry.expiresAt < Date.now()) {
    challenges.delete(did)
    return false
  }
  const student = await studentRepository.findByDid(did)
  if (!student) return false

  const ok = verifyMessage(signature, entry.nonce, student.publicKey)
  if (ok) challenges.delete(did) // consume the nonce on success
  return ok
}
