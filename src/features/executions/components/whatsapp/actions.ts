"use server";

import { whatsappChannel } from "@/inngest/channels/whatsapp";
import { inngest } from "@/inngest/client";
import { getSubscriptionToken, Realtime } from "@inngest/realtime";

export type WhatsAppToken = Realtime.Token<
    typeof whatsappChannel,
    ["status"]
>;

export async function fetchWhatsAppRealtimeToken():
 Promise<WhatsAppToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: whatsappChannel(),
        topics: ["status"],
    });

    return token;
}