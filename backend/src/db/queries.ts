import { Static } from '@sinclair/typebox'
import { postItemsRequestSchema } from '../parsers'
import type {
  QueueItemRow,
  SearchSubtitlePhrasePartRow,
  SubtitlePhraseItemInput,
  UserInput,
  UserRow,
  VideoItemInput,
} from './types'
import { withPool } from './pool'

// TODO: use some kind of ORM instead of raw SQL queries? knex.js? sequelize? I don't think we need a full ORM like Prisma

const generateQuestionMarksForMultiInsert = <T extends Record<string, unknown>>(items: T[]) => {
  return items
    .map((item, i) => {
      const nofKeys = Object.keys(item).length
      const inner = Object.keys(item)
        .map((_, j) => `$${i * nofKeys + j + 1}`)
        .join(', ')
      return `(${inner})`
    })
    .join(', ')
}

export const insertQueueItems = (items: Static<typeof postItemsRequestSchema>, userId: number) => {
  return withPool(async (pool) => {
    const query = `INSERT INTO "Queue" ("videoId", "title", "channelId", "userId") VALUES ${generateQuestionMarksForMultiInsert(
      items.map((e) => ({ videoTitle: e.videoTitle, videoId: e.videoId, channelId: e.channelId, userId })),
    )}`
    return pool.query(query, items.map((item) => [item.videoId, item.videoTitle, item.channelId, userId]).flat())
  })
}

export const getQueueItems = async () => {
  return withPool(async (pool) => {
    const query = `SELECT * FROM "Queue" LIMIT 10`
    const { rows } = await pool.query(query)
    return rows as Array<QueueItemRow>
  })
}

export const existsVideoItem = async ({ videoId }: { videoId: string }) => {
  return withPool(async (pool) => {
    const query = `SELECT id FROM "Videos" WHERE "videoId" = $1`
    const { rowCount } = await pool.query(query, [videoId])
    return rowCount > 0
  })
}

export const insertVideoItem = async (item: VideoItemInput) => {
  return withPool(async (pool) => {
    const query = `INSERT INTO "Videos" ("videoId", "title", "channelId", "lang", "userId") VALUES ($1, $2, $3, $4, $5) RETURNING "id"`
    const { rows } = await pool.query(query, [item.videoId, item.title, item.channelId, item.lang, item.userId])
    return rows[0] as { id: number }
  })
}

export const insertSubtitlePhraseItems = (items: SubtitlePhraseItemInput[]) => {
  return withPool(async (pool) => {
    const newLocal = generateQuestionMarksForMultiInsert(items)
    const variables = items.map((item) => [item.from, item.duration, item.text, item.videoId]).flat()
    const query = `INSERT INTO "SubtitlePhrases" ("from", "duration", "text", "videoId") VALUES ${newLocal}`
    return pool.query(query, variables)
  })
}

export const deleteQueueItem = (id: number) => {
  return withPool(async (pool) => {
    const query = `DELETE FROM "Queue" WHERE id = $1`
    return pool.query(query, [id])
  })
}

export const searchSubtitlePhrasePart = async (text: string, { page, userId }: { page: number; userId: number }) => {
  return withPool(async (pool) => {
    const query = `
    SELECT
      "SubtitlePhrases"."id" as "cursor",
      "SubtitlePhrases"."from",
      "SubtitlePhrases"."duration",
      "SubtitlePhrases"."text",
      "Videos"."videoId",
      "Videos"."lang",
      "Videos"."title" AS "videoTitle",
      "Videos"."channelId"
    FROM
      "Videos"
      JOIN "SubtitlePhrases" ON "Videos"."id" = "SubtitlePhrases"."videoId"
    WHERE
      "SubtitlePhrases"."id" > $2
      AND "Videos"."userId" = $3
      AND text
      LIKE '%' || $1 || '%'
    LIMIT 50
    ;`
    const { rows } = await pool.query(query, [text, page, userId])
    return rows as Array<SearchSubtitlePhrasePartRow>
  })
}

export const saveUser = (user: UserInput) => {
  return withPool(async (pool) => {
    const query = `
    INSERT INTO "Users" ("email", "passwordHash", "preferredLanguage")
    VALUES ($1, $2, $3)
    RETURNING "id";
  `
    return pool
      .query(query, [user.email, user.passwordHash, user.preferredLanguage])
      .then((res) => ({ ...user, id: res.rows[0].id }) as UserRow)
  })
}

export const getUser = (email: string) => {
  return withPool(async (pool) => {
    const query = `
    SELECT * FROM "Users" WHERE "email" = $1;
  `
    return pool.query(query, [email]).then((res) => res.rows[0] as UserRow)
  })
}
