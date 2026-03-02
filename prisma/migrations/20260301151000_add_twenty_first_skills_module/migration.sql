-- CreateTable
CREATE TABLE "TwentyFirstSkill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "trendSummary" TEXT,
    "examples" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sources" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwentyFirstSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectToTwentyFirstSkill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "TwentyFirstSkill_industry_idx" ON "TwentyFirstSkill"("industry");

-- CreateIndex
CREATE INDEX "TwentyFirstSkill_isActive_idx" ON "TwentyFirstSkill"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TwentyFirstSkill_name_industry_key" ON "TwentyFirstSkill"("name", "industry");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectToTwentyFirstSkill_AB_unique" ON "_ProjectToTwentyFirstSkill"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectToTwentyFirstSkill_B_index" ON "_ProjectToTwentyFirstSkill"("B");

-- AddForeignKey
ALTER TABLE "_ProjectToTwentyFirstSkill" ADD CONSTRAINT "_ProjectToTwentyFirstSkill_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToTwentyFirstSkill" ADD CONSTRAINT "_ProjectToTwentyFirstSkill_B_fkey" FOREIGN KEY ("B") REFERENCES "TwentyFirstSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

