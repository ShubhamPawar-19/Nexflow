-- AlterEnum
ALTER TYPE "NodeType" ADD VALUE 'GMAIL_TRIGGER';

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;
