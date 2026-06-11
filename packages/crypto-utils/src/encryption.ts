// Symmetric encryption utilities for Category B evidence escrow.
//
// Evidence is encrypted with AES-256-GCM. For the neutral dual-key escrow
// model, the working key is derived from BOTH the student key and the platform
// key, so neither party can decrypt evidence unilaterally.

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit nonce recommended for GCM
const encoder = new TextEncoder()

export interface EncryptedPayload {
  algorithm: typeof ALGORITHM
  /** base64-encoded ciphertext. */
  ciphertext: string
  /** base64-encoded initialization vector / nonce. */
  iv: string
  /** base64-encoded GCM authentication tag. */
  authTag: string
}

function toKeyBytes(key: Uint8Array | string): Buffer {
  if (typeof key === 'string') {
    // Hash arbitrary-length string keys down to a stable 32-byte key.
    return createHash('sha256').update(key).digest()
  }
  if (key.length === 32) {
    return Buffer.from(key)
  }
  return createHash('sha256').update(Buffer.from(key)).digest()
}

/**
 * Derive the neutral escrow key from a student key and a platform key.
 * key = SHA-256(studentKey || platformKey). Both halves are required to
 * reconstruct the working key, enforcing the dual-control property.
 */
export function deriveEscrowKey(
  studentKey: Uint8Array | string,
  platformKey: Uint8Array | string,
): Uint8Array {
  const hash = createHash('sha256')
  hash.update(toKeyBytes(studentKey))
  hash.update(toKeyBytes(platformKey))
  return new Uint8Array(hash.digest())
}

/** Encrypt a UTF-8 plaintext string with AES-256-GCM. */
export function encrypt(plaintext: string, key: Uint8Array | string): EncryptedPayload {
  const keyBytes = toKeyBytes(key)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, keyBytes, iv)
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(encoder.encode(plaintext))),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return {
    algorithm: ALGORITHM,
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

/** Decrypt an {@link EncryptedPayload} back into its UTF-8 plaintext. */
export function decrypt(payload: EncryptedPayload, key: Uint8Array | string): string {
  const keyBytes = toKeyBytes(key)
  const decipher = createDecipheriv(ALGORITHM, keyBytes, Buffer.from(payload.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}

/** SHA-256 hash of an arbitrary string, returned as lower-case hex. */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
