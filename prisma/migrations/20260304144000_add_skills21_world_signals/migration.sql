-- CreateTable
CREATE TABLE "Skills21WorldSignal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'NOTICIA',
    "sourceUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "industry" TEXT,
    "occupationFocus" TEXT,
    "skillFocus" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skills21WorldSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skills21WorldSignalSyncState" (
    "id" TEXT NOT NULL DEFAULT 'skills21-world-sync',
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "lastSyncAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "nextSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skills21WorldSignalSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skills21WorldSignal_sourceUrl_key" ON "Skills21WorldSignal"("sourceUrl");

-- CreateIndex
CREATE INDEX "Skills21WorldSignal_publishedAt_idx" ON "Skills21WorldSignal"("publishedAt");

-- CreateIndex
CREATE INDEX "Skills21WorldSignal_capturedAt_idx" ON "Skills21WorldSignal"("capturedAt");

-- CreateIndex
CREATE INDEX "Skills21WorldSignal_sourceType_idx" ON "Skills21WorldSignal"("sourceType");
