import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

let pool: NodePgDatabase
export const initialize = ({ databaseUri }: { databaseUri: string }) => {
  const p = new Pool({
    connectionString: databaseUri,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
  pool = drizzle(p)
}

const checkPool = () => {
  if (!pool) {
    throw new Error('DB is not initialized')
  }
}

export const withDb = <T>(fn: (pool: NodePgDatabase) => Promise<T>) => {
  checkPool()
  return fn(pool)
}
