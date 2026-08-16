import { google } from "googleapis";

export interface GmailCredentials {
    accessToken: string;
    refreshToken?: string;
    expiryDate?: number;
}

export interface SendGmailParams {
    accessToken: string;
    refreshToken?: string;
    expiryDate?: number;
    to: string;
    subject: string;
    body: string;
}

const createGmailOAuthClient = ({
    accessToken,
    refreshToken,
    expiryDate,
}: GmailCredentials) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_GMAIL_CLIENT_ID,
        process.env.GOOGLE_GMAIL_CLIENT_SECRET,
        process.env.GOOGLE_GMAIL_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: expiryDate,
    });

    return oauth2Client;
};

const createRawMessage = ({
    to,
    subject,
    body,
}: {
    to: string;
    subject: string;
    body: string;
}) => {
    const message = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        body,
    ].join("\r\n");

    return Buffer.from(message)
        .toString("base64url");
};

export const sendGmailEmail = async ({
    accessToken,
    refreshToken,
    expiryDate,
    to,
    subject,
    body,
}: SendGmailParams) => {
    const oauth2Client = createGmailOAuthClient({
        accessToken,
        refreshToken,
        expiryDate,
    });

    const gmail = google.gmail({
        version: "v1",
        auth: oauth2Client,
    });

    const raw = createRawMessage({
        to,
        subject,
        body,
    });

    const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw,
        },
    });

    return response.data;
};