import { google } from "googleapis";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { createGmailOAuthClient } from "@/lib/gmail";

type GmailCredential = {
    accessToken: string;
    refreshToken?: string | null;
    expiryDate?: number | null;
};

export const registerGmailWatch = async ({
    credentialId,
    userId,
}: {
    credentialId: string;
    userId: string;
}) => {
    const credential = await prisma.credential.findFirst({
        where: {
            id: credentialId,
            userId,
            type: "GMAIL",
        },
    });

    if (!credential) {
        throw new Error("Gmail credential not found");
    }

    const gmailCredential = JSON.parse(
        decrypt(credential.value),
    ) as GmailCredential;

    if (!gmailCredential.accessToken) {
        throw new Error("Gmail access token is missing");
    }

    if (!gmailCredential.refreshToken) {
        throw new Error(
            "Gmail refresh token is missing. Please reconnect your Gmail account.",
        );
    }

    const oauth2Client = createGmailOAuthClient();

    oauth2Client.setCredentials({
        access_token: gmailCredential.accessToken,
        refresh_token: gmailCredential.refreshToken,
        expiry_date: gmailCredential.expiryDate ?? undefined,
    });

    const gmail = google.gmail({
        version: "v1",
        auth: oauth2Client,
    });

    const topicName = process.env.GMAIL_PUBSUB_TOPIC;

    if (!topicName) {
        throw new Error("GMAIL_PUBSUB_TOPIC is not configured");
    }

    const response = await gmail.users.watch({
        userId: "me",
        requestBody: {
            topicName,
            labelIds: ["INBOX"],
        },
    });

    return {
        credentialId,
        accountEmail: credential.accountEmail,
        historyId: response.data.historyId,
        expiration: response.data.expiration,
    };
};