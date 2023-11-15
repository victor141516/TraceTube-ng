import * as queries from './queries'

export const queue = {
  insert: queries.insertQueueItems,
  get: queries.getQueueItems,
  delete: queries.deleteQueueItem,
}
export const video = {
  exists: queries.existsVideoItem,
  insert: queries.insertVideoItem,
  userRelation: {
    exists: queries.existsVideoUserRelation,
    assign: queries.assignVideoToUser,
  },
}
export const subtitlePhrase = {
  insert: queries.insertSubtitlePhraseItems,
  searchPart: queries.searchSubtitlePhrasePart,
}
export const user = {
  insert: queries.saveUser,
  get: queries.getUser,
}

export type Operations = {
  queue: typeof queue
  video: typeof video
  subtitlePhrase: typeof subtitlePhrase
  user: typeof user
}
