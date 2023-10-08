import type { Static } from '@sinclair/typebox'
import type { postItemsRequestSchema } from '.'

type PostItemsRequestData = Static<typeof postItemsRequestSchema>
export type PostItemsRequestItem = PostItemsRequestData[number]
