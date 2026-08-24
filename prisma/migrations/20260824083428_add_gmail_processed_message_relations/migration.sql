/*
  Warnings:

  - A unique constraint covering the columns `[credentialId,messageId,workflowId]` on the table `GmailProcessedMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "GmailProcessedMessage_credentialId_workflowId_messageId_key";

-- CreateIndex
CREATE UNIQUE INDEX "GmailProcessedMessage_credentialId_messageId_workflowId_key" ON "GmailProcessedMessage"("credentialId", "messageId", "workflowId");
