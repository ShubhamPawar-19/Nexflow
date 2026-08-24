-- CreateTable
CREATE TABLE "GmailProcessedMessage" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GmailProcessedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GmailProcessedMessage_credentialId_idx" ON "GmailProcessedMessage"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "GmailProcessedMessage_credentialId_messageId_key" ON "GmailProcessedMessage"("credentialId", "messageId");
