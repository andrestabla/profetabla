-- AlterTable
ALTER TABLE "RecognitionAward" ADD COLUMN "verificationCode" TEXT;

-- Backfill existing rows deterministically using award id
UPDATE "RecognitionAward"
SET "verificationCode" = 'rcg_' || REPLACE("id", '-', '')
WHERE "verificationCode" IS NULL;

-- Enforce required field
ALTER TABLE "RecognitionAward" ALTER COLUMN "verificationCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RecognitionAward_verificationCode_key" ON "RecognitionAward"("verificationCode");
