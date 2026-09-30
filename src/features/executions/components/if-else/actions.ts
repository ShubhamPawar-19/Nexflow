"use server";

import { ifElseChannel } from "@/inngest/channels/if-else";
import { inngest } from "@/inngest/client";
import { getSubscriptionToken, Realtime } from "@inngest/realtime";

export type IfElseToken = Realtime.Token<
    typeof ifElseChannel,
    ["status"]
>;

export async function fetchIfElseRealtimeToken(): Promise<IfElseToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: ifElseChannel(),
        topics: ["status"],
    });

    return token;
}