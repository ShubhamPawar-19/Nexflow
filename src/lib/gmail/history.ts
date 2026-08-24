import { decrypt } from "@/lib/encryption";
import { createGmailOAuthClient } from "@/lib/gmail";
import { google } from "googleapis";

type GmailCredential = {
    accessToken: string;
    refreshToken?: string | null;
    expiryDate?: number | null;
};

export const getGmailHistory = async (
  credentialValue: string,
  startHistoryId: string,
) => {

  const gmailCredential = JSON.parse(
    decrypt(credentialValue),
  ) as GmailCredential;

    const oauth2Client = createGmailOAuthClient();

    oauth2Client.setCredentials({
        access_token: gmailCredential.accessToken,
        refresh_token:
            gmailCredential.refreshToken ?? undefined,
        expiry_date:
            gmailCredential.expiryDate ?? undefined,
    });

    const gmail = google.gmail({
        version: "v1",
        auth: oauth2Client,
    });

    const response = await gmail.users.history.list({
        userId: "me",
        startHistoryId,
        historyTypes: ["messageAdded"],
    });

    return response.data;
};