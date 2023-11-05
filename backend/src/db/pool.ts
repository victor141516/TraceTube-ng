import { Pool } from 'pg'

let pool: Pool
export const initialize = ({ databaseUri }: { databaseUri: string }) => {
  pool = new Pool({
    connectionString: databaseUri,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })
}

const checkPool = () => {
  if (!pool) {
    throw new Error('DB is not initialized')
  }
}

export const withPool = <T,>(fn: (pool: Pool) => Promise<T>) => {
  checkPool()
  return fn(pool)
}
