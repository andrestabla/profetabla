-- AlterTable
ALTER TABLE "TwentyFirstSkill"
ADD COLUMN "sourceProvider" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "sourceUri" TEXT,
ADD COLUMN "sourceLanguage" TEXT,
ADD COLUMN "sourceLastSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "TwentyFirstSkill_sourceUri_key" ON "TwentyFirstSkill"("sourceUri");

-- CreateIndex
CREATE INDEX "TwentyFirstSkill_sourceProvider_idx" ON "TwentyFirstSkill"("sourceProvider");
