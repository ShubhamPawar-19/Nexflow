"use server";

import { gmailChannel } from "@/inngest/channels/gmail";
import { inngest } from "@/inngest/client";
import {
    getSubscriptionToken,
    Realtime,
} from "@inngest/realtime";

export type GmailToken = Realtime.Token<
    typeof gmailChannel,
    ["status"]
>;

export async function fetchGmailRealtimeToken(): Promise<GmailToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: gmailChannel(),
        topics: ["status"],
    });

    return token;
}

