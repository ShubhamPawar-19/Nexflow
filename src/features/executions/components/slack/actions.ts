"use server";

import { slackChannel } from "@/inngest/channels/slack";
import { inngest } from "@/inngest/client";
import { getSubscriptionToken, Realtime } from "@inngest/realtime";


export type SlackToken = Realtime.Token<typeof slackChannel,
    ["status"]
>;

export async function fetchSlackRealtimeToken():
    Promise<SlackToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: slackChannel(),
        topics: ["status"],
    });

    return token;
};