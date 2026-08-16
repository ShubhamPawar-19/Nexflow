import { google } from "googleapis";

const GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
];

export const createGmailOAuthClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_GMAIL_CLIENT_ID,
        process.env.GOOGLE_GMAIL_CLIENT_SECRET,
        process.env.GOOGLE_GMAIL_REDIRECT_URI,
    );
};

export const getGmailAuthorizationUrl = (state: string) => {
    const oauth2Client = createGmailOAuthClient();

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: GMAIL_SCOPES,
        include_granted_scopes: true,
        prompt: "consent",
        state,
    });
};