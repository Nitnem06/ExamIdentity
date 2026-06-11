// Ed25519 signing for the auth challenge (browser).
// Uses @noble/ed25519's async API with SubtleCrypto providing SHA-512, so no
// extra hashing dependency is needed.

import * as ed from '@noble/ed25519'

ed.etc.sha512Async = async (...m: Uint8Array[]) =>
  new Uint8Array(await crypto.subtle.digest('SHA-512', ed.etc.concatBytes(...m)))

function fromHex(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Sign a nonce string with a hex private key; returns a hex signature. */
export async function signNonce(nonce: string, privateKeyHex: string): Promise<string> {
  const signature = await ed.signAsync(new TextEncoder().encode(nonce), fromHex(privateKeyHex))
  return toHex(signature)
}
