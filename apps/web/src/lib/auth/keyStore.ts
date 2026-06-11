// Self-custody key store.
//
// The student's Ed25519 private key never leaves the browser. It's encrypted
// with a passphrase (PBKDF2 -> AES-256-GCM via WebCrypto) and kept in
// IndexedDB. Login decrypts it locally to sign an auth challenge.

import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'examidentity-keys'
const STORE = 'keys'
const PBKDF2_ITERATIONS = 150_000

interface StoredKey {
  salt: string
  iv: string
  ciphertext: string
}

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    },
  })
}

function toB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptPrivateKey(
  privateKeyHex: string,
  passphrase: string,
): Promise<StoredKey> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveAesKey(passphrase, salt)
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(privateKeyHex) as BufferSource,
  )
  return { salt: toB64(salt), iv: toB64(iv), ciphertext: toB64(ct) }
}

export async function decryptPrivateKey(stored: StoredKey, passphrase: string): Promise<string> {
  const key = await deriveAesKey(passphrase, fromB64(stored.salt))
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(stored.iv) as BufferSource },
    key,
    fromB64(stored.ciphertext) as BufferSource,
  )
  return new TextDecoder().decode(pt)
}

/** Encrypt and persist the private key for a DID on this device. */
export async function storeKey(
  did: string,
  privateKeyHex: string,
  passphrase: string,
): Promise<void> {
  const stored = await encryptPrivateKey(privateKeyHex, passphrase)
  const db = await getDb()
  await db.put(STORE, stored, did)
}

/** Whether an encrypted key for this DID exists on this device. */
export async function hasKey(did: string): Promise<boolean> {
  const db = await getDb()
  return (await db.getKey(STORE, did)) !== undefined
}

/** Decrypt the stored key with the passphrase. Throws if missing/incorrect. */
export async function unlockKey(did: string, passphrase: string): Promise<string> {
  const db = await getDb()
  const stored = (await db.get(STORE, did)) as StoredKey | undefined
  if (!stored) throw new Error('No stored key for this DID on this device')
  try {
    return await decryptPrivateKey(stored, passphrase)
  } catch {
    throw new Error('Incorrect passphrase')
  }
}

/** Export the encrypted key as a recovery string (safe to move between devices). */
export async function exportRecovery(did: string): Promise<string> {
  const db = await getDb()
  const stored = (await db.get(STORE, did)) as StoredKey | undefined
  if (!stored) throw new Error('No stored key to export')
  return JSON.stringify({ did, ...stored })
}

/** Import a recovery string onto this device. Returns the DID it belongs to. */
export async function importRecovery(recoveryJson: string): Promise<string> {
  const obj = JSON.parse(recoveryJson) as StoredKey & { did: string }
  const db = await getDb()
  await db.put(STORE, { salt: obj.salt, iv: obj.iv, ciphertext: obj.ciphertext }, obj.did)
  return obj.did
}

/** Remove the stored key for a DID from this device. */
export async function removeKey(did: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, did)
}
