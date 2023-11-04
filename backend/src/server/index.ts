import { bearer } from '@elysiajs/bearer'
import { Elysia } from 'elysia'
import { postItemsRequestSchema } from '../parsers'
import { jwt } from './jwt'
import * as handlers from './handlers'
import { authGuard, searchGuard } from './handlers'

const app = new Elysia()
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
            .post('/login', async ({ jwt, body }) => await handlers.loginHandler(body, jwt))
            .post('/signup', async ({ jwt, body }) => await handlers.singupHandler(body, jwt)),
        ),
      )
      .derive(async ({ jwt, bearer }) => authGuard({ jwt, bearer }))
      .group('/v1', (v1) =>
        v1
          .post('/items', async ({ body, user }) => await handlers.postItemsHandler(body, user), {
            body: postItemsRequestSchema,
          })
          .get('/search', async ({ query: { q, p }, user }) => await handlers.searchHandler(q, p, user), {
            query: handlers.searchQueryParams,
            beforeHandle: ({ query }) => searchGuard(query),
          }),
      ),
  )

export const start = ({ port }: { port: number }) => {
  return app.listen(port)
}

export const stop = () => {
  app.stop()
}
