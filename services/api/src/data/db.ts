// Postgres connection pool (node-postgres).
import { Pool } from 'pg'
import { config } from '../config'

let pool: Pool | undefined

/** Lazily-created shared connection pool. */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: config.databaseUrl, max: 10 })
    pool.on('error', (err) => {
      // Log unexpected idle-client errors; don't crash the process.
      // eslint-disable-next-line no-console
      console.error('Postgres pool error:', err)
    })
  }
  return pool
}

/** Run a parameterized query and return the rows. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T[]> {
  const result = await getPool().query(text, params as unknown[])
  return result.rows as T[]
}

/** Close the pool (used on graceful shutdown / tests). */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = undefined
  }
}
