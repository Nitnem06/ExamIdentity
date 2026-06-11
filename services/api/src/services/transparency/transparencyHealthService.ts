// Transparency log health service.
//
// Verifies the append-only, hash-chained transparency log and reports its
// health (chain integrity + Merkle root). Uses @examidentity/crypto-utils for
// the hashing so the same primitives back the log everywhere.

import { computeMerkleRoot, chainEntryHash, sha256Hex } from '@examidentity/crypto-utils'
import type { TransparencyLogHealth } from '@examidentity/shared-types'

const GENESIS_PREV = '0'.repeat(64)

interface LogEntry {
  index: number
  entryType: string
  payload: string
  timestamp: string
  entryHash: string
  prevHash: string
}

/** Build a deterministic, valid mock log chain for the MVP. */
function buildMockLog(): LogEntry[] {
  const seedEvents: Array<{ entryType: string; payload: string; timestamp: string }> = [
    { entryType: 'GENESIS', payload: 'EXAMIDENTITY_GENESIS_2026', timestamp: '2026-01-01T00:00:00Z' },
    { entryType: 'ENROLLMENT_CREATED', payload: 'enroll:univ-demo', timestamp: '2026-02-01T08:00:00Z' },
    { entryType: 'EXAM_SESSION_STARTED', payload: 'session:sess-001', timestamp: '2026-06-10T10:00:00Z' },
    { entryType: 'EXAM_SESSION_COMPLETED', payload: 'session:sess-001', timestamp: '2026-06-10T12:00:00Z' },
    { entryType: 'CREDENTIAL_ISSUED', payload: 'credential:cred-001', timestamp: '2026-06-10T12:05:00Z' },
    { entryType: 'DISPUTE_AUTO_RESOLVED', payload: 'dispute:disp-014', timestamp: '2026-06-10T12:30:00Z' },
  ]

  const entries: LogEntry[] = []
  let prevHash = GENESIS_PREV
  seedEvents.forEach((evt, index) => {
    const canonical = `${index}|${evt.entryType}|${evt.payload}|${evt.timestamp}`
    const entryHash = chainEntryHash(prevHash, canonical)
    entries.push({ index, ...evt, entryHash, prevHash })
    prevHash = entryHash
  })
  return entries
}

/** Verify chain linkage; returns the index where it breaks, or -1 if intact. */
function verifyChain(entries: LogEntry[]): number {
  let prevHash = GENESIS_PREV
  for (const entry of entries) {
    const canonical = `${entry.index}|${entry.entryType}|${entry.payload}|${entry.timestamp}`
    const expected = chainEntryHash(prevHash, canonical)
    if (entry.prevHash !== prevHash || entry.entryHash !== expected) {
      return entry.index
    }
    prevHash = entry.entryHash
  }
  return -1
}

export function getTransparencyLogHealth(): TransparencyLogHealth {
  const entries = buildMockLog()
  const brokenAt = verifyChain(entries)
  const chainVerified = brokenAt === -1
  const last = entries[entries.length - 1]
  const merkleRoot = computeMerkleRoot(entries.map((e) => e.entryHash))

  return {
    status: chainVerified ? 'HEALTHY' : 'BROKEN',
    totalEntries: entries.length,
    lastEntryHash: last.entryHash,
    lastEntryAt: last.timestamp,
    chainVerified,
    merkleRoot,
    brokenAtIndex: chainVerified ? undefined : brokenAt,
  }
}

/** Stable hash of a metric snapshot, used as a tamper-evident snapshot id. */
export function snapshotHash(serialized: string): string {
  return sha256Hex(serialized)
}
