"use server";

import {
    getSubscriptionToken,
} from "@inngest/realtime";

import { inngest } from "@/inngest/client";
import {
    gmailTriggerChannel,
} from "@/inngest/channels/gmail-trigger";

export async function fetchGmailTriggerRealtimeToken() {
    return getSubscriptionToken(inngest, {
        channel: gmailTriggerChannel(),
        topics: ["status"],
    });
}