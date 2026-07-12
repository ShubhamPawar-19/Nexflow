"use server";

import { discordChannel } from "@/inngest/channels/discord";
import { inngest } from "@/inngest/client";
import { getSubscriptionToken, Realtime } from "@inngest/realtime";


export type DiscordToken = Realtime.Token<typeof discordChannel,
    ["status"]
>;

export async function fetchDiscordRealtimeToken():
    Promise<DiscordToken> {
    const token = await getSubscriptionToken(inngest, {
        channel: discordChannel(),
        topics: ["status"],
    });

    return token;
};