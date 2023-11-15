import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const Videos = pgTable('Videos', {
  id: serial('id').primaryKey(),
  videoId: varchar('videoId', { length: 11 }).notNull(),
  lang: varchar('lang', { length: 2 }).notNull(),
  title: varchar('title').notNull(),
  channelId: varchar('channelId').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
})

export const Users = pgTable('Users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  passwordHash: text('passwordHash').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
})

export const Queue = pgTable('Queue', {
  id: serial('id').primaryKey(),
  videoId: varchar('videoId', { length: 11 }).notNull(),
  title: varchar('title').notNull(),
  channelId: varchar('channelId').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  userId: integer('userId')
    .references(() => Users.id)
    .notNull(),
})

export const SubtitlePhrases = pgTable('SubtitlePhrases', {
  id: serial('id').primaryKey(),
  from: varchar('from', { length: 20 }).notNull(),
  duration: varchar('duration', { length: 20 }).notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  videoId: integer('videoId')
    .references(() => Videos.id)
    .notNull(),
})

export const UsersVideosRelation = pgTable('UsersVideosRelation', {
  id: serial('id').primaryKey(),
  userId: integer('userId')
    .references(() => Users.id)
    .notNull(),
  videoId: integer('videoId')
    .references(() => Videos.id)
    .notNull(),
})

export type User = InferSelectModel<typeof Users>
export type NewUser = InferInsertModel<typeof Users>
export type Video = InferSelectModel<typeof Videos>
export type NewVideo = InferInsertModel<typeof Videos>
export type QueueItem = InferSelectModel<typeof Queue>
export type NewQueueItem = InferInsertModel<typeof Queue>
export type SubtitlePhrase = InferSelectModel<typeof SubtitlePhrases>
export type NewSubtitlePhrase = InferInsertModel<typeof SubtitlePhrases>
export type UsersVideosRelation = InferSelectModel<typeof UsersVideosRelation>
export type NewUsersVideosRelation = InferInsertModel<typeof UsersVideosRelation>
