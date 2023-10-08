import type { PostItemsRequestItem } from '../parsers/types'

export type QueueItemRow = Omit<PostItemsRequestItem, 'videoTitle'> & {
  title: PostItemsRequestItem['videoTitle']
  id: number
  userId: number
}
export type VideoItemInput = Omit<QueueItemRow, 'id'> & { lang: string }
export type SubtitlePhraseItemInput = { from: string; duration: string; text: string; videoId: number }
export type SearchSubtitlePhrasePartRow = {
  cursor: number
  from: string
  duration: string
  text: string
  videoId: string
  lang: string
  videoTitle: string
  channelId: string
}
export type UserInput = {
  email: string
  passwordHash: string
  preferredLanguage?: string
}

export type UserRow = UserInput & {
  id: number
}
