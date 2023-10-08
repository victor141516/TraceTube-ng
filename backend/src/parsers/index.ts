import { t } from 'elysia'

export const postItemsRequestSchema = t.Array(
  t.Object({
    videoTitle: t.String(),
    videoId: t.String(),
    channelId: t.String(),
  }),
)
