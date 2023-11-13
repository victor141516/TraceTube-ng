import { bearer } from '@elysiajs/bearer'
import { Elysia } from 'elysia'
import type { Operations } from '../db'
import * as db from '../db'
import { postItemsRequestSchema } from '../parsers'
import * as handlers from './handlers'
import { jwt } from './jwt'

export const _initializeApp = (operations: Operations) =>
  new Elysia()
    .onAfterHandle(({ response }) => ({ result: 'success', data: response }))
    .onError(({ error }) => ({ result: 'error', error: error.message }))
    .use(jwt)
    .use(bearer())
    .group('/api', (api) =>
      api
        .use(handlers.cors)
        .group('/auth', (auth) =>
          auth.guard(handlers.authBody, (guarded) =>
            guarded
              .post('/login', async ({ jwt, body }) => await handlers.loginHandler(operations, body, jwt))
              .post('/signup', async ({ jwt, body }) => await handlers.singupHandler(operations, body, jwt)),
          ),
        )
        .derive(async ({ jwt, bearer }) => handlers.authGuard({ jwt, bearer }))
        .group('/v1', (v1) =>
          v1
            .post('/items', async ({ body, user }) => await handlers.postItemsHandler(operations, body, user), {
              body: postItemsRequestSchema,
            })
            .get('/search', async ({ query: { q, p }, user }) => await handlers.searchHandler(operations, q, p, user), {
              query: handlers.searchQueryParams,
              beforeHandle: ({ query }) => handlers.searchGuard(query),
            }),
        ),
    )

let app: ReturnType<typeof _initializeApp>
export const start = ({ port }: { port: number }) => {
  if (app) throw new Error('App is already started')
  app = _initializeApp(db)
  return app.listen(port)
}

export const stop = () => {
  if (!app) throw new Error('App is not started')
  app.stop()
}
