// High-level auth API for the web client.
//
// Your login/enroll PAGES should call only these functions — the crypto, key
// storage, and token handling are done for you.
//
//   listUniversities()                  -> University[]
//   enroll({ universityId, passphrase}) -> { did, profile }   (also logs in)
//   login(did, passphrase)              -> AuthMe              (returning user)
//   getMe()                             -> AuthMe | null       (is the session valid?)
//   logout()                            -> void
//   hasKey(did) / exportRecovery(did) / importRecovery(json)  (device key mgmt)
//
// Model: self-custody. The private key is generated server-side at enrollment,
// returned ONCE, then encrypted with the student's passphrase and stored only
// in this browser (IndexedDB). The server never holds the key.

import { apiClient } from '../api/client'
import { signNonce } from './sign'
import { hasKey, storeKey, unlockKey } from './keyStore'
import { clearToken, getToken, setToken } from './session'
import type { AuthMe, EnrollResult, StudentProfile, University } from '@/types/auth'

export async function listUniversities(): Promise<University[]> {
  const { data } = await apiClient.get<University[]>('/api/universities')
  return data
}

export interface EnrollOptions {
  universityId: string
  passphrase: string
  accommodation?: string
}

/** First-time enrollment: creates the identity, stores the key, logs in. */
export async function enroll(
  opts: EnrollOptions,
): Promise<{ did: string; profile: StudentProfile }> {
  const { data } = await apiClient.post<EnrollResult>('/api/enroll', {
    universityId: opts.universityId,
    custodyTier: 'SELF_CUSTODY',
    accommodation: opts.accommodation ?? 'NONE',
  })
  if (!data.privateKey) {
    throw new Error('Enrollment did not return a private key (unexpected custody tier)')
  }
  await storeKey(data.did, data.privateKey, opts.passphrase)
  setToken(data.token)
  return { did: data.did, profile: data.profile }
}

/** Returning-user login via passphrase + DID challenge/response. */
export async function login(did: string, passphrase: string): Promise<AuthMe> {
  const privateKeyHex = await unlockKey(did, passphrase) // throws on wrong passphrase
  const { data: challenge } = await apiClient.post<{ nonce: string }>('/api/auth/challenge', {
    did,
  })
  const signature = await signNonce(challenge.nonce, privateKeyHex)
  const { data } = await apiClient.post<{ token: string; profile?: StudentProfile }>(
    '/api/auth/login',
    { did, signature },
  )
  setToken(data.token)
  return { role: 'student', subject: did, profile: data.profile }
}

/** Return the current session principal, or null if not logged in / expired. */
export async function getMe(): Promise<AuthMe | null> {
  if (!getToken()) return null
  try {
    const { data } = await apiClient.get<AuthMe>('/api/auth/me')
    return data
  } catch {
    return null
  }
}

export function logout(): void {
  clearToken()
}

export { hasKey } from './keyStore'
export { exportRecovery, importRecovery, removeKey } from './keyStore'
export { getToken } from './session'
