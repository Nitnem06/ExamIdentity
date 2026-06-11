// Merkle tree utilities for the append-only transparency log.
//
// Leaves and internal nodes are hashed with SHA-256. Domain separation bytes
// (0x00 for leaves, 0x01 for internal nodes) follow RFC 6962 to prevent
// second-preimage attacks.

import { sha256 } from '@noble/hashes/sha256'
import { toHex, fromHex } from './signing'

const LEAF_PREFIX = Uint8Array.of(0x00)
const NODE_PREFIX = Uint8Array.of(0x01)

const encoder = new TextEncoder()

function toBytes(value: string | Uint8Array): Uint8Array {
  return typeof value === 'string' ? encoder.encode(value) : value
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

/** Hash a single leaf value (RFC 6962 domain-separated). */
export function hashLeaf(value: string | Uint8Array): Uint8Array {
  return sha256(concat(LEAF_PREFIX, toBytes(value)))
}

/** Hash two child nodes into their parent (RFC 6962 domain-separated). */
export function hashNodes(left: Uint8Array, right: Uint8Array): Uint8Array {
  return sha256(concat(NODE_PREFIX, concat(left, right)))
}

export interface MerkleProofStep {
  /** Sibling hash (hex). */
  hash: string
  /** Whether the sibling sits on the left of the current node. */
  isLeft: boolean
}

/**
 * Compute the Merkle root over an ordered list of leaves.
 * Returns a hex-encoded root. An empty input yields the hash of an empty leaf.
 */
export function computeMerkleRoot(leaves: Array<string | Uint8Array>): string {
  if (leaves.length === 0) {
    return toHex(sha256(LEAF_PREFIX))
  }

  let level = leaves.map((leaf) => hashLeaf(leaf))

  while (level.length > 1) {
    const next: Uint8Array[] = []
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i]
      // Promote a lone node (odd count) by duplicating it.
      const right = i + 1 < level.length ? level[i + 1] : left
      next.push(hashNodes(left, right))
    }
    level = next
  }

  return toHex(level[0])
}

/**
 * Build a Merkle inclusion proof for the leaf at `index`.
 * The returned steps, applied in order, reconstruct the root.
 */
export function getMerkleProof(
  leaves: Array<string | Uint8Array>,
  index: number,
): MerkleProofStep[] {
  if (index < 0 || index >= leaves.length) {
    throw new Error(`Leaf index ${index} out of range (0..${leaves.length - 1})`)
  }

  const proof: MerkleProofStep[] = []
  let level = leaves.map((leaf) => hashLeaf(leaf))
  let idx = index

  while (level.length > 1) {
    const isRightNode = idx % 2 === 1
    const siblingIndex = isRightNode ? idx - 1 : idx + 1
    const sibling = siblingIndex < level.length ? level[siblingIndex] : level[idx]
    proof.push({ hash: toHex(sibling), isLeft: isRightNode })

    const next: Uint8Array[] = []
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i]
      const right = i + 1 < level.length ? level[i + 1] : left
      next.push(hashNodes(left, right))
    }
    level = next
    idx = Math.floor(idx / 2)
  }

  return proof
}

/**
 * Verify that `leaf` is included under `root` given an inclusion `proof`.
 */
export function verifyMerkleProof(
  leaf: string | Uint8Array,
  proof: MerkleProofStep[],
  root: string,
): boolean {
  let computed = hashLeaf(leaf)

  for (const step of proof) {
    const sibling = fromHex(step.hash)
    computed = step.isLeft ? hashNodes(sibling, computed) : hashNodes(computed, sibling)
  }

  return toHex(computed) === (root.startsWith('0x') ? root.slice(2) : root)
}

/**
 * Compute the next entry hash for a hash-chained log entry.
 * entryHash = SHA-256(prevHash || canonicalPayload).
 */
export function chainEntryHash(prevHash: string, payload: string | Uint8Array): string {
  return toHex(sha256(concat(toBytes(prevHash), toBytes(payload))))
}
