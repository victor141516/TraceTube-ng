import * as db from '../db'
import { getHash, verifyHash } from '../utils/hash'
import { JWT, JWTObject } from './jwt'
import { CHROME_EXTENSION_URL_ORIGIN, FRONTEND_URL_ORIGIN } from '../config'
import { t } from 'elysia'
import { cors as corsGenerator } from '@elysiajs/cors'

export async function loginHandler(body: { email: string; password: string }, jwt: JWT) {
  const error = new Error('Invalid email or password')
  const user = await db.user.get(body.email)
  if (!user) throw error
  const verified = await verifyHash(body.password, user.passwordHash)
  if (!verified) throw error
  const token = await jwt.sign({
    id: user.id,
    email: body.email,
    preferredLanguage: user.preferredLanguage ?? '',
  })
  return { token }
}

export async function singupHandler(body: { email: string; password: string }, jwt: JWT) {
  const user = await db.user.insert({
    email: body.email,
    passwordHash: await getHash(body.password),
  })
  console.log('New user:', user.email)
  const token = await jwt.sign({
    id: user.id,
    email: body.email,
    preferredLanguage: user.preferredLanguage ?? '',
  })
  return { token }
}

export async function searchHandler(q: string, p: string | undefined, user: JWTObject) {
  return await db.subtitlePhrase.searchPart(q, { page: p ? Number.parseInt(p) : 1, userId: user.id })
}

export async function postItemsHandler(
  body: { videoTitle: string; videoId: string; channelId: string }[],
  user: JWTObject,
) {
  try {
    const CHUNK_SIZE = 100
    const chunks = [] as Array<typeof body>
    for (let i = 0; i < body.length; i += CHUNK_SIZE) {
      chunks.push(body.slice(i, i + CHUNK_SIZE))
    }
    for (const chunk of chunks) {
      await db.queue.insert(chunk, user.id)
    }
  } catch (error) {
    console.error('Error while inserting items:', error)
    throw error
  }
  console.log('Queued items:', body.length)
  return { item: body.length }
}

export async function authGuard({ jwt, bearer }: { jwt: JWT; bearer?: string }) {
  if (bearer) {
    const user = await jwt.verify(bearer)
    if (user) return { user }
  }
  throw new Error('Unauthorized')
}

export function searchGuard(query: { p?: string | undefined; q: string }) {
  if (query.p && Number.parseInt(query.p) < 1) {
    throw new Error('Page must be a positive integer')
  }
}

export const cors = corsGenerator({
  origin: [FRONTEND_URL_ORIGIN, CHROME_EXTENSION_URL_ORIGIN, 'www.youtube.com'].filter(Boolean) as string[],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
export const authBody = { body: t.Object({ email: t.String({ format: 'email' }), password: t.String() }) }
export const searchQueryParams = t.Object({ q: t.String(), p: t.Optional(t.String()) })
