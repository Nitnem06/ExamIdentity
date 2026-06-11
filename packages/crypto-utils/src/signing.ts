// Ed25519 signing utilities used for verifiable credentials and the
// transparency log. Built on @noble/ed25519 with @noble/hashes providing the
// SHA-512 implementation required for synchronous signing.

import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha512'

// @noble/ed25519 v2 requires a SHA-512 implementation to be wired up before
// the synchronous sign/verify/getPublicKey helpers can be used.
ed.etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed.etc.concatBytes(...m))

export interface KeyPair {
  /** 32-byte Ed25519 private (seed) key. */
  privateKey: Uint8Array
  /** 32-byte Ed25519 public key. */
  publicKey: Uint8Array
  /** Hex-encoded private key. */
  privateKeyHex: string
  /** Hex-encoded public key. */
  publicKeyHex: string
}

/** Lower-case hex encoding of a byte array. */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Decode a hex string into bytes. */
export function fromHex(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  if (clean.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd length')
  }
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

const encoder = new TextEncoder()

function toBytes(message: string | Uint8Array): Uint8Array {
  return typeof message === 'string' ? encoder.encode(message) : message
}

/** Generate a fresh Ed25519 key pair. */
export function generateKeyPair(): KeyPair {
  const privateKey = ed.utils.randomPrivateKey()
  const publicKey = ed.getPublicKey(privateKey)
  return {
    privateKey,
    publicKey,
    privateKeyHex: toHex(privateKey),
    publicKeyHex: toHex(publicKey),
  }
}

/** Sign a message with an Ed25519 private key. Returns a hex signature. */
export function sign(message: string | Uint8Array, privateKey: Uint8Array | string): string {
  const key = typeof privateKey === 'string' ? fromHex(privateKey) : privateKey
  const signature = ed.sign(toBytes(message), key)
  return toHex(signature)
}

/** Verify an Ed25519 signature (hex) against a message and public key. */
export function verify(
  signature: string | Uint8Array,
  message: string | Uint8Array,
  publicKey: Uint8Array | string,
): boolean {
  try {
    const sig = typeof signature === 'string' ? fromHex(signature) : signature
    const key = typeof publicKey === 'string' ? fromHex(publicKey) : publicKey
    return ed.verify(sig, toBytes(message), key)
  } catch {
    return false
  }
}

/**
 * Derive a did:key identifier from an Ed25519 public key.
 * Note: this is a simplified MVP encoding (hex), not full multibase/multicodec.
 * Replace with Veramo's did:key provider for production credentials.
 */
export function publicKeyToDidKey(publicKey: Uint8Array | string): string {
  const hex = typeof publicKey === 'string' ? publicKey : toHex(publicKey)
  return `did:key:z${hex}`
}
