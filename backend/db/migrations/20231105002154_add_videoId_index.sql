-- migrate:up
CREATE UNIQUE INDEX "Videos_videoId_index" ON "public"."Videos" USING BTREE ("videoId");

-- migrate:down
DROP INDEX "public"."Videos_videoId_index";

