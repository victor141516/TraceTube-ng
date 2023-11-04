-- migrate:up
-- create the pivot table
CREATE SEQUENCE IF NOT EXISTS "UsersVideosRelation_id_seq";
CREATE TABLE "public"."UsersVideosRelation" (
    "id" int4 NOT NULL DEFAULT nextval('"UsersVideosRelation_id_seq"'::regclass),
    "userId" int4 NOT NULL,
    "videoId" int4 NOT NULL,
    CONSTRAINT "UsersVideosRelation_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."Videos"("id"),
    CONSTRAINT "UsersVideosRelation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."Users"("id"),
    PRIMARY KEY ("id")
);
CREATE INDEX "UsersVideosRelation_userId_fk" ON "public"."UsersVideosRelation" USING BTREE ("userId");
CREATE INDEX "UsersVideosRelation_videoId_fk" ON "public"."UsersVideosRelation" USING BTREE ("videoId");
-- create a composite index to improve performance
CREATE UNIQUE INDEX "UsersVideosRelation_videoId_userId_composite" ON "public"."UsersVideosRelation" USING BTREE ("videoId","userId");
-- populate the pivot table
INSERT INTO "UsersVideosRelation" ("videoId", "userId") SELECT id AS "videoId", "userId" FROM "Videos";
-- remove the fk column in Videos
ALTER TABLE "Videos" DROP COLUMN "userId";

-- migrate:down
-- create the fk column in Videos
ALTER TABLE "public"."Videos" ADD COLUMN "userId" int4;
ALTER TABLE "public"."Videos" ADD FOREIGN KEY ("userId") REFERENCES "public"."Users" ("id");
CREATE INDEX "Videos_userId_fk" ON "public"."Videos" USING BTREE ("userId");
-- populate the fk column in Videos
UPDATE "Videos" SET "userId" = (SELECT "userId" FROM "UsersVideosRelation" WHERE "UsersVideosRelation"."videoId" = "Videos"."id");
-- set the column as not nullable
ALTER TABLE "public"."Videos" SET "userId" ALTER COLUMN "asd" SET NOT NULL;
-- remove the pivot table
DROP TABLE IF EXISTS "public"."UsersVideosRelation";

