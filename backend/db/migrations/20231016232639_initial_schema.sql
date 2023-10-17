-- migrate:up
--- User auth
CREATE SEQUENCE IF NOT EXISTS "Users_id_seq";
CREATE TABLE "public"."Users" (
    "id" int4 NOT NULL DEFAULT nextval('"Users_id_seq"'::regclass),
    "email" text NOT NULL,
    "passwordHash" text NOT NULL,
    "preferredLanguage" varchar,
    "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Users_email_unique" ON "public"."Users" USING BTREE ("email");
---
---
DROP TABLE IF EXISTS "public"."SubtitlePhrases";
CREATE SEQUENCE IF NOT EXISTS "SubtitlePhrases_id_seq";
CREATE TABLE "public"."SubtitlePhrases" (
    "id" int4 NOT NULL DEFAULT nextval('"SubtitlePhrases_id_seq"'::regclass),
    "from" varchar(20) NOT NULL,
    "duration" varchar(20) NOT NULL,
    "text" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "videoId" int4,
    PRIMARY KEY ("id")
);
---
---
DROP TABLE IF EXISTS "public"."Videos";
CREATE SEQUENCE IF NOT EXISTS "Videos_id_seq";
CREATE TABLE "public"."Videos" (
    "id" int4 NOT NULL DEFAULT nextval('"Videos_id_seq"'::regclass),
    "videoId" varchar(11),
    "lang" varchar(2),
    "title" varchar,
    "channelId" varchar,
    "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
    "userId" int4 NOT NULL,
    CONSTRAINT "Videos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id"),
    PRIMARY KEY ("id")
);
ALTER TABLE "public"."SubtitlePhrases"
ADD FOREIGN KEY ("videoId") REFERENCES "public"."Videos"("id");
---
---
DROP TABLE IF EXISTS "public"."Queue";
CREATE SEQUENCE IF NOT EXISTS "Queue_id_seq";
CREATE TABLE "public"."Queue" (
    "id" int4 NOT NULL DEFAULT nextval('"Queue_id_seq"'::regclass),
    "videoId" varchar(11),
    "title" varchar,
    "channelId" varchar,
    "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
    "userId" int4 NOT NULL,
    CONSTRAINT "Queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id"),
    PRIMARY KEY ("id")
);
---
--- Text search optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX trgm_idx ON "SubtitlePhrases" USING gin (text gin_trgm_ops);
CREATE INDEX "SubtitlePhrases_videoId_fk" ON "public"."SubtitlePhrases" USING BTREE ("videoId");
CREATE INDEX "Videos_userId_fk" ON "public"."Videos" USING BTREE ("userId");

-- migrate:down

DROP TABLE IF EXISTS "public"."SubtitlePhrases";
DROP TABLE IF EXISTS "public"."Videos";
DROP TABLE IF EXISTS "public"."Queue";
