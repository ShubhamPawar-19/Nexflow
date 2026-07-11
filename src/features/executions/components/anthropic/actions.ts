"use server";

import { anthropicChannel } from "@/inngest/channels/anthropic";
import { inngest } from "@/inngest/client";
import { getSubscriptionToken, Realtime } from "@inngest/realtime";


export type AnthropicToken = Realtime.Token<typeof anthropicChannel,
    ["status"]
>;

export async function fetchAnthropicRealtimeToken():
    Promise<AnthropicToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: anthropicChannel(),
        topics: ["status"],
    });

    return token;
};