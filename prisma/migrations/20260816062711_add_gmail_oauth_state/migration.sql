-- CreateTable
CREATE TABLE "GmailOAuthState" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GmailOAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GmailOAuthState_state_key" ON "GmailOAuthState"("state");

-- CreateIndex
CREATE INDEX "GmailOAuthState_userId_idx" ON "GmailOAuthState"("userId");

-- CreateIndex
CREATE INDEX "GmailOAuthState_expiresAt_idx" ON "GmailOAuthState"("expiresAt");
