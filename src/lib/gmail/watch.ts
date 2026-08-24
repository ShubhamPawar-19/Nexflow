import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { createGmailOAuthClient } from "@/lib/gmail";
import { google } from "googleapis";

const GMAIL_PUBSUB_TOPIC =
    "projects/nexflow-502405/topics/nexflow-gmail";

type GmailCredential = {
    accessToken: string;
    refreshToken?: string | null;
    expiryDate?: number | null;
};

export const setupGmailWatch = async (credentialId: string) => {
    const credential = await prisma.credential.findUnique({
        where: {
            id: credentialId,
            type: "GMAIL",
        },
    });

    if (!credential) {
        throw new Error("Gmail credential not found");
    }

    let gmailCredential: GmailCredential;

    try {
        gmailCredential = JSON.parse(
            decrypt(credential.value),
        ) as GmailCredential;
    } catch {
        throw new Error("Invalid Gmail credential");
    }

    if (!gmailCredential.accessToken) {
        throw new Error("Gmail access token is missing");
    }

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

    const response = await gmail.users.watch({
        userId: "me",
        requestBody: {
            topicName: GMAIL_PUBSUB_TOPIC,
            labelIds: ["INBOX"],
        },
    });

    const historyId = response.data.historyId;
    const expiration = response.data.expiration;

    if (!historyId || !expiration) {
        throw new Error("Gmail watch did not return required information");
    }

    await prisma.credential.update({
        where: {
            id: credentialId,
        },
        data: {
            gmailHistoryId: historyId,
            gmailWatchExpiration: new Date(Number(expiration)),
        },
    });

    return {
        historyId,
        expiration: new Date(Number(expiration)),
    };
};