// Transparency log append service (Phases 5 & 7).
//
// Appends hash-chained entries to the transparency_log table on key events.
// entryHash = SHA-256(prevHash || canonicalPayload); treeHash chains the prior
// tree hash with the new entry hash. No personal data beyond optional DID/exam
// references is written (the table is designed for hashes + references only).

import { chainEntryHash, sha256Hex } from '@examidentity/crypto-utils'
import { config } from '../../config'
import { query } from '../../data/db'

const GENESIS_PREV = '0'.repeat(64)

export interface LogEntryInput {
  entryType: string
  studentDid?: string
  examId?: string
  escrowId?: string
  metadata?: Record<string, unknown>
}

interface TailRow {
  entry_hash: string
  tree_hash: string
}

/**
 * Append an entry to the transparency log. No-op (returns undefined) when not
 * running against Postgres, so mock-mode demos don't fail.
 */
export async function appendLogEntry(
  input: LogEntryInput,
): Promise<{ entryHash: string } | undefined> {
  if (config.dataSource !== 'postgres') return undefined

  const tail = await query<TailRow>(
    `SELECT entry_hash, tree_hash FROM transparency_log ORDER BY id DESC LIMIT 1`,
  )
  const prevHash = tail[0]?.entry_hash ?? GENESIS_PREV
  const prevTree = tail[0]?.tree_hash ?? GENESIS_PREV

  const canonical = JSON.stringify({
    entryType: input.entryType,
    studentDid: input.studentDid ?? null,
    examId: input.examId ?? null,
    escrowId: input.escrowId ?? null,
    metadata: input.metadata ?? {},
    ts: new Date().toISOString(),
  })
  const entryHash = chainEntryHash(prevHash, canonical)
  const treeHash = sha256Hex(prevTree + entryHash)

  await query(
    `INSERT INTO transparency_log
       (entry_hash, prev_hash, tree_hash, entry_type, student_did, exam_id, escrow_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (entry_hash) DO NOTHING`,
    [
      entryHash,
      prevHash,
      treeHash,
      input.entryType,
      input.studentDid ?? null,
      input.examId ?? null,
      input.escrowId ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  )

  return { entryHash }
}
