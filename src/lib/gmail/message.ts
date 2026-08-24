import { google } from "googleapis";

import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { createGmailOAuthClient } from "@/lib/gmail";

type GmailCredential = {
    accessToken: string;
    refreshToken?: string | null;
    expiryDate?: number | null;
};

export const getGmailMessage = async (
    credentialId: string,
    messageId: string,
) => {
    const credential = await prisma.credential.findUnique({
        where: {
            id: credentialId,
            type: "GMAIL",
        },
    });

    if (!credential) {
        throw new Error("Gmail credential not found");
    }

    const gmailCredential = JSON.parse(
        decrypt(credential.value),
    ) as GmailCredential;

    const oauth2Client = createGmailOAuthClient();

    oauth2Client.setCredentials({
        access_token: gmailCredential.accessToken,
        refresh_token: gmailCredential.refreshToken ?? undefined,
        expiry_date: gmailCredential.expiryDate ?? undefined,
    });

    const gmail = google.gmail({
        version: "v1",
        auth: oauth2Client,
    });

    const response = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
    });

    return response.data;
};