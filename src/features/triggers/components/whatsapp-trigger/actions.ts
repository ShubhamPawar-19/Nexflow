"use server";

import { getSubscriptionToken, Realtime } from "@inngest/realtime";

import { inngest } from "@/inngest/client";
import { whatsappTriggerChannel } from "@/inngest/channels/whatsapp-trigger";

export type WhatsAppTriggerToken = Realtime.Token<
    typeof whatsappTriggerChannel,
    ["status"]
>;

export async function fetchWhatsAppTriggerRealtimeToken(): Promise<WhatsAppTriggerToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: whatsappTriggerChannel(),
        topics: ["status"],
    });

    return token;
}