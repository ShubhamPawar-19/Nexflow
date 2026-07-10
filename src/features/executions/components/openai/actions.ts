"use server";

import { openAiChannel } from "@/inngest/channels/openai";
import { inngest } from "@/inngest/client";
import { getSubscriptionToken, Realtime } from "@inngest/realtime";


export type OpenAiToken = Realtime.Token<typeof openAiChannel,
    ["status"]
>;

export async function fetchOpenAiRealtimeToken():
    Promise<OpenAiToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: openAiChannel(),
        topics: ["status"],
    });

    return token;
};