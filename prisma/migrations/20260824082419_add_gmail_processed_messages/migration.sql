/*
  Warnings:

  - A unique constraint covering the columns `[credentialId,workflowId,messageId]` on the table `GmailProcessedMessage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workflowId` to the `GmailProcessedMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "GmailProcessedMessage_credentialId_messageId_key";

-- AlterTable
ALTER TABLE "GmailProcessedMessage" ADD COLUMN     "workflowId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "GmailProcessedMessage_workflowId_idx" ON "GmailProcessedMessage"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "GmailProcessedMessage_credentialId_workflowId_messageId_key" ON "GmailProcessedMessage"("credentialId", "workflowId", "messageId");

-- AddForeignKey
ALTER TABLE "GmailProcessedMessage" ADD CONSTRAINT "GmailProcessedMessage_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GmailProcessedMessage" ADD CONSTRAINT "GmailProcessedMessage_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
