import { gmail_v1 } from "googleapis";

export type ParsedGmailMessage = {
    messageId: string;
    threadId: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    snippet: string;
};

export const parseGmailMessage = (
    message: gmail_v1.Schema$Message,
): ParsedGmailMessage => {
    const headers = message.payload?.headers ?? [];

    const getHeader = (name: string) =>
        headers.find(
            (header) =>
                header.name?.toLowerCase() === name.toLowerCase(),
        )?.value ?? "";

    const extractBody = (
        payload: gmail_v1.Schema$MessagePart | undefined,
    ): string => {
        if (!payload) return "";

        if (payload.mimeType === "text/plain" && payload.body?.data) {
            return Buffer.from(
                payload.body.data,
                "base64url",
            ).toString("utf-8");
        }

        if (payload.parts) {
            for (const part of payload.parts) {
                const body = extractBody(part);

                if (body) return body;
            }
        }

        return "";
    };

    return {
        messageId: message.id ?? "",
        threadId: message.threadId ?? "",
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject"),
        body: extractBody(message.payload),
        snippet: message.snippet ?? "",
    };
};