export const PORT = Number.parseInt(process.env.PORT || '3000')
export const DATABASE_URI =
  process.env.DATABASE_URI || 'postgresql://yourarch:yourarch@localhost:55432/yourarch?schema=public'
export const MODE = (process.env.MODE || 'server') === 'server' ? 'server' : 'worker'

const DEFAULT_JTW_SECRET = 'CHANGE ME'
export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JTW_SECRET
export const FRONTEND_URL_ORIGIN = process.env.FRONTEND_URL_ORIGIN || '127.0.0.1:5173'
export const CHROME_EXTENSION_URL_ORIGIN = process.env.CHROME_EXTENSION_URL_ORIGIN

if (JWT_SECRET === DEFAULT_JTW_SECRET) {
  console.warn('!!!!!!!!!! JWT_SECRET is not set, using default value')
}
