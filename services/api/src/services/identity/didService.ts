// DID service — creates did:key identifiers backed by Ed25519 keys.
// Uses @examidentity/crypto-utils (lightweight did:key for the MVP; can be
// replaced by Veramo's did:key provider later without changing callers).

import { generateKeyPair, publicKeyToDidKey, sign, verify } from '@examidentity/crypto-utils'

export interface CreatedDid {
  did: string
  publicKeyHex: string
  privateKeyHex: string
}

/** Generate a fresh did:key + Ed25519 key pair. */
export function createDidKey(): CreatedDid {
  const kp = generateKeyPair()
  return {
    did: publicKeyToDidKey(kp.publicKey),
    publicKeyHex: kp.publicKeyHex,
    privateKeyHex: kp.privateKeyHex,
  }
}

/** Sign a message with a hex private key (re-export for callers). */
export function signMessage(message: string, privateKeyHex: string): string {
  return sign(message, privateKeyHex)
}

/** Verify a hex signature against a message and hex public key. */
export function verifyMessage(
  signature: string,
  message: string,
  publicKeyHex: string,
): boolean {
  return verify(signature, message, publicKeyHex)
}
