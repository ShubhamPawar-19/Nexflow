/*
  Warnings:

  - The values [GMAIL] on the enum `CredentialType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CredentialType_new" AS ENUM ('OPENAI', 'ANTHROPIC', 'GEMINI', 'WHATSAPP');
ALTER TABLE "Credential" ALTER COLUMN "type" TYPE "CredentialType_new" USING ("type"::text::"CredentialType_new");
ALTER TYPE "CredentialType" RENAME TO "CredentialType_old";
ALTER TYPE "CredentialType_new" RENAME TO "CredentialType";
DROP TYPE "public"."CredentialType_old";
COMMIT;
