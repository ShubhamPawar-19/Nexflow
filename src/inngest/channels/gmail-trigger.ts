import { channel, topic } from "@inngest/realtime";

export const GMAIL_TRIGGER_CHANNEL_NAME = "gmail-trigger-execution";

export const gmailTriggerChannel = channel(
    GMAIL_TRIGGER_CHANNEL_NAME,
).addTopic(
    topic("status").type<{
        nodeId: string;
        status: "loading" | "success" | "error";
    }>(),
);