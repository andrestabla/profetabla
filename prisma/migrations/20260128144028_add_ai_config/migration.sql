-- AlterTable
ALTER TABLE "PlatformConfig" ADD COLUMN     "aiInstructions" TEXT DEFAULT 'Actúa como un experto Diseñador Instruccional...',
ADD COLUMN     "aiSearchEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiTone" TEXT NOT NULL DEFAULT 'ACADEMIC';
