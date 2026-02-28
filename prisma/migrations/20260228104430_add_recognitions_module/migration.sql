-- CreateEnum
CREATE TYPE "RecognitionType" AS ENUM ('CERTIFICATE', 'BADGE');

-- CreateTable
CREATE TABLE "RecognitionConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "RecognitionType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateBody" TEXT,
    "imageUrl" TEXT,
    "autoAward" BOOLEAN NOT NULL DEFAULT true,
    "requireAllAssignments" BOOLEAN NOT NULL DEFAULT false,
    "requireAllGradedAssignments" BOOLEAN NOT NULL DEFAULT false,
    "minCompletedAssignments" INTEGER,
    "minGradedAssignments" INTEGER,
    "minAverageGrade" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecognitionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecognitionAward" (
    "id" TEXT NOT NULL,
    "recognitionConfigId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggerSubmissionId" TEXT,
    "snapshot" JSONB,

    CONSTRAINT "RecognitionAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecognitionConfig_projectId_type_idx" ON "RecognitionConfig"("projectId", "type");

-- CreateIndex
CREATE INDEX "RecognitionConfig_projectId_isActive_idx" ON "RecognitionConfig"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "RecognitionAward_projectId_studentId_idx" ON "RecognitionAward"("projectId", "studentId");

-- CreateIndex
CREATE INDEX "RecognitionAward_studentId_awardedAt_idx" ON "RecognitionAward"("studentId", "awardedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecognitionAward_recognitionConfigId_studentId_key" ON "RecognitionAward"("recognitionConfigId", "studentId");

-- AddForeignKey
ALTER TABLE "RecognitionConfig" ADD CONSTRAINT "RecognitionConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecognitionAward" ADD CONSTRAINT "RecognitionAward_recognitionConfigId_fkey" FOREIGN KEY ("recognitionConfigId") REFERENCES "RecognitionConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecognitionAward" ADD CONSTRAINT "RecognitionAward_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecognitionAward" ADD CONSTRAINT "RecognitionAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecognitionAward" ADD CONSTRAINT "RecognitionAward_triggerSubmissionId_fkey" FOREIGN KEY ("triggerSubmissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

