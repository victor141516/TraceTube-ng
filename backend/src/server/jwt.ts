import jwtGenerator from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'
import { JWT_SECRET } from '../config'

const JWTPayloadSchema = t.Object({
  id: t.Integer(),
  email: t.String({ format: 'email' }),
  preferredLanguage: t.Optional(t.String()),
})

export const jwt = jwtGenerator<'jwt', typeof JWTPayloadSchema>({
  name: 'jwt',
  secret: JWT_SECRET,
})
type ExtractGeneric<Type> = Type extends Elysia<any, infer X> ? X : never

export type JWT = ExtractGeneric<typeof jwt>['request']['jwt']
export type JWTObject = Parameters<JWT['sign']>[0]
