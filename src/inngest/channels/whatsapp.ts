import { channel, topic } from "@inngest/realtime";

export const WHATSAPP_CHANNEL_NAME = "whatsapp-execution";

export const whatsappChannel = channel(WHATSAPP_CHANNEL_NAME).addTopic(
    topic("status").type<{
        nodeId: string;
        status: "loading" | "success" | "error";
    }>(),
);