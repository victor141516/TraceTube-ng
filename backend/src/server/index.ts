import { bearer } from '@elysiajs/bearer'
import { cors } from '@elysiajs/cors'
import jwt from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'
import { CHROME_EXTENSION_URL_ORIGIN, FRONTEND_URL_ORIGIN, JWT_SECRET } from '../config'
import { getUser, insertQueueItems, saveUser, searchSubtitlePhrasePart } from '../db'
import { postItemsRequestSchema } from '../parsers'
import { getHash, verifyHash } from '../utils/hash'
import * as requestId from '../utils/requestId'
import { requestID } from 'elysia-requestid'

const JWTPayloadSchema = t.Object({
  id: t.Integer(),
  email: t.String({ format: 'email' }),
  preferredLanguage: t.Optional(t.String()),
})

const app = new Elysia()
  .onAfterHandle(({ response }) => ({ result: 'success', data: response }))
  .onError(({ error }) => ({ result: 'error', error: error.message }))
  .use(requestID())
  .use(
    jwt<'jwt', typeof JWTPayloadSchema>({
      name: 'jwt',
      secret: JWT_SECRET,
    }),
  )
  .use(bearer())
  .group('/api', (api) =>
    api
      .use(
        cors({
          origin: [FRONTEND_URL_ORIGIN, CHROME_EXTENSION_URL_ORIGIN, 'www.youtube.com'].filter(Boolean) as string[],
          allowedHeaders: ['Content-Type', 'Authorization'],
        }),
      )
      .group('/auth', (auth) =>
        auth.guard({ body: t.Object({ email: t.String({ format: 'email' }), password: t.String() }) }, (guarded) =>
          guarded
            .post('/login', async ({ jwt, body, requestID }) => {
              return await requestId.wrap(requestID, async () => {
                const error = new Error('Invalid email or password')
                const user = await getUser(body.email)
                if (!user) throw error
                const verified = await verifyHash(body.password, user.passwordHash)
                if (!verified) throw error
                const token = await jwt.sign({
                  id: user.id,
                  email: body.email,
                  preferredLanguage: user.preferredLanguage ?? '',
                })
                return { token }
              })
            })
            .post('/signup', async ({ jwt, body, requestID }) => {
              return await requestId.wrap(requestID, async () => {
                const user = await saveUser({
                  email: body.email,
                  passwordHash: await getHash(body.password),
                })
                requestId.console.log(['New user:', user.email])
                const token = await jwt.sign({
                  id: user.id,
                  email: body.email,
                  preferredLanguage: user.preferredLanguage ?? '',
                })
                return { token }
              })
            }),
        ),
      )
      .derive(async ({ jwt, bearer }) => {
        if (bearer) {
          const user = await jwt.verify(bearer)
          if (user) return { user }
        }
        throw new Error('Unauthorized')
      })
      .group('/v1', (v1) =>
        v1
          .post(
            '/items',
            async ({ body, user, requestID }) => {
              return await requestId.wrap(requestID, async () => {
                try {
                  const CHUNK_SIZE = 100
                  const chunks = [] as Array<typeof body>
                  for (let i = 0; i < body.length; i += CHUNK_SIZE) {
                    chunks.push(body.slice(i, i + CHUNK_SIZE))
                  }
                  for (const chunk of chunks) {
                    await insertQueueItems(chunk, user.id)
                  }
                } catch (error) {
                  requestId.console.error(['Error while inserting items:', error])
                  throw error
                }
                requestId.console.log(['Queued items:', body.length])
                return { item: body.length }
              })
            },
            { body: postItemsRequestSchema },
          )
          .get(
            '/search',
            async ({ query: { q, p }, user, requestID }) => {
              return await requestId.wrap(requestID, async () => {
                return await searchSubtitlePhrasePart(q, { page: p ? Number.parseInt(p) : 1, userId: user.id })
              })
            },
            {
              query: t.Object({ q: t.String(), p: t.Optional(t.String()) }),
              beforeHandle: ({ query }) => {
                if (query.p && Number.parseInt(query.p) < 1) {
                  throw new Error('Page must be a positive integer')
                }
              },
            },
          ),
      ),
  )

export const start = ({ port }: { port: number }) => {
  return app.listen(port)
}

export const stop = () => {
  app.stop()
}
