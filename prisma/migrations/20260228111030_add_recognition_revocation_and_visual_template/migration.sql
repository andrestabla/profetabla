-- AlterTable
ALTER TABLE "RecognitionAward" ADD COLUMN     "isRevoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedByEmail" TEXT,
ADD COLUMN     "revokedReason" TEXT;

-- AlterTable
ALTER TABLE "RecognitionConfig" ADD COLUMN     "backgroundUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "signatureImageUrl" TEXT,
ADD COLUMN     "signatureName" TEXT,
ADD COLUMN     "signatureRole" TEXT;

