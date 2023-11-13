import { and, eq, gt, inArray, like, sql } from 'drizzle-orm'
import { PostItemsRequestItem } from '../../parsers/types'
import { withDb } from './client'
import { NewSubtitlePhrase, NewUser, Queue, SubtitlePhrases, Users, UsersVideosRelation, Videos } from './models'

export const insertQueueItems = (items: Array<PostItemsRequestItem>, userId: number) => {
  return withDb(async (db) => {
    const queryItems = items.map((e) => ({
      title: e.videoTitle,
      videoId: e.videoId,
      channelId: e.channelId,
      userId,
    }))
    await db.insert(Queue).values(queryItems)
  })
}

export const getQueueItems = async () => {
  return withDb(async (db) => {
    return await db.select().from(Queue).limit(10)
  })
}

export const existsVideoItem = async ({ videoId }: { videoId: string }) => {
  return withDb(async (db) => {
    const items = await db.select({ id: Videos.id }).from(Videos).where(eq(Videos.videoId, videoId))
    return items.length > 0
  })
}

export const insertVideoItem = async (item: {
  videoId: string
  channelId: string
  title: string
  userId: number
  lang: string
}) => {
  return withDb(async (db) => {
    const [{ videoId }] = await db.transaction(async (tx) => {
      const newVideo = await tx.insert(Videos).values(item).returning({ id: Videos.id })
      return tx
        .insert(UsersVideosRelation)
        .values({ userId: item.userId, videoId: newVideo[0].id })
        .returning({ videoId: UsersVideosRelation.videoId })
    })
    return { id: videoId }
  })
}

export const existsVideoUserRelation = async ({ videoId, userId }: { videoId: string; userId: number }) => {
  return withDb(async (db) => {
    const existingVideo = db
      .$with('existingVideo')
      .as(db.select({ id: Videos.id }).from(Videos).where(eq(Videos.videoId, videoId)))
    const items = await db
      .with(existingVideo)
      .select()
      .from(UsersVideosRelation)
      .where(
        //
        and(
          //
          eq(UsersVideosRelation.userId, userId),
          eq(UsersVideosRelation.videoId, db.select({ id: existingVideo.id }).from(existingVideo)),
        ),
      )

    return items.length > 0
  })
}

export const assignVideoToUser = async ({ videoId, userId }: { videoId: string; userId: number }) => {
  return withDb(async (db) => {
    await db.transaction(async (tx) => {
      const existingVideo = await tx.select({ id: Videos.id }).from(Videos).where(eq(Videos.videoId, videoId))
      await tx.insert(UsersVideosRelation).values({ userId, videoId: existingVideo[0].id })
    })
  })
}

export const insertSubtitlePhraseItems = (items: NewSubtitlePhrase[]) => {
  return withDb(async (db) => {
    await db.insert(SubtitlePhrases).values(items)
  })
}

export const deleteQueueItem = (id: number) => {
  return withDb(async (db) => {
    await db.delete(Queue).where(eq(Queue.id, id))
  })
}

export const searchSubtitlePhrasePart = async (text: string, { page, userId }: { page: number; userId: number }) => {
  return withDb(async (db) => {
    const userVideoIds = db
      .$with('UserVideoIds')
      .as(
        db
          .select({ videoId: UsersVideosRelation.videoId })
          .from(UsersVideosRelation)
          .where(eq(UsersVideosRelation.userId, userId)),
      )
    const userVideos = db.$with('UserVideos').as(
      db
        .select()
        .from(Videos)
        .where(inArray(Videos.id, db.select({ id: userVideoIds.videoId }).from(userVideoIds))),
    )
    const query = db
      .with(userVideoIds, userVideos)
      .select({
        cursor: SubtitlePhrases.id,
        from: SubtitlePhrases.from,
        duration: SubtitlePhrases.duration,
        text: SubtitlePhrases.text,
        videoId: userVideos.videoId,
        lang: userVideos.lang,
        videoTitle: userVideos.title,
        channelId: userVideos.channelId,
      })
      .from(userVideos)
      .innerJoin(SubtitlePhrases, eq(SubtitlePhrases.videoId, userVideos.id))
      .where(
        //
        and(
          //
          gt(SubtitlePhrases.id, page),
          like(SubtitlePhrases.text, sql`'%' || ${text} || '%'`),
        ),
      )
      .limit(50)

    return await query
  })
}

export const saveUser = (user: NewUser) => {
  return withDb(async (db) => {
    return (await db.insert(Users).values(user).returning())[0]
  })
}

export const getUser = (email: string) => {
  return withDb(async (db) => {
    return (await db.select().from(Users).where(eq(Users.email, email)))[0]
  })
}
