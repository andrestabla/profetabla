-- CreateTable
CREATE TABLE "Occupation" (
    "id" TEXT NOT NULL,
    "dataSource" TEXT NOT NULL,
    "geography" TEXT NOT NULL,
    "industryCode" TEXT,
    "occupationCode" TEXT,
    "occupationTitle" TEXT NOT NULL,
    "occupationType" TEXT NOT NULL DEFAULT 'Summary',
    "qualificationLevel" TEXT NOT NULL DEFAULT 'Total',
    "canonicalKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Occupation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccupationForecast" (
    "id" TEXT NOT NULL,
    "occupationId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "employmentCount" DOUBLE PRECISION NOT NULL,
    "percentOfIndustry" DOUBLE PRECISION,
    "percentOfOccupation" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccupationForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OccupationToTwentyFirstSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Occupation_canonicalKey_key" ON "Occupation"("canonicalKey");

-- CreateIndex
CREATE INDEX "Occupation_dataSource_idx" ON "Occupation"("dataSource");

-- CreateIndex
CREATE INDEX "Occupation_geography_idx" ON "Occupation"("geography");

-- CreateIndex
CREATE INDEX "Occupation_occupationTitle_idx" ON "Occupation"("occupationTitle");

-- CreateIndex
CREATE UNIQUE INDEX "OccupationForecast_occupationId_year_key" ON "OccupationForecast"("occupationId", "year");

-- CreateIndex
CREATE INDEX "OccupationForecast_year_idx" ON "OccupationForecast"("year");

-- CreateIndex
CREATE UNIQUE INDEX "_OccupationToTwentyFirstSkill_AB_unique" ON "_OccupationToTwentyFirstSkill"("A", "B");

-- CreateIndex
CREATE INDEX "_OccupationToTwentyFirstSkill_B_index" ON "_OccupationToTwentyFirstSkill"("B");

-- AddForeignKey
ALTER TABLE "OccupationForecast" ADD CONSTRAINT "OccupationForecast_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OccupationToTwentyFirstSkill" ADD CONSTRAINT "_OccupationToTwentyFirstSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Occupation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OccupationToTwentyFirstSkill" ADD CONSTRAINT "_OccupationToTwentyFirstSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "TwentyFirstSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
