/*
  Warnings:

  - You are about to drop the column `workflowId` on the `GmailProcessedMessage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[credentialId,messageId]` on the table `GmailProcessedMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "GmailProcessedMessage" DROP CONSTRAINT "GmailProcessedMessage_workflowId_fkey";

-- DropIndex
DROP INDEX "GmailProcessedMessage_credentialId_messageId_workflowId_key";

-- DropIndex
DROP INDEX "GmailProcessedMessage_workflowId_idx";

-- AlterTable
ALTER TABLE "GmailProcessedMessage" DROP COLUMN "workflowId";

-- CreateIndex
CREATE UNIQUE INDEX "GmailProcessedMessage_credentialId_messageId_key" ON "GmailProcessedMessage"("credentialId", "messageId");
