import type { NodeExecutor } from "@/features/executions/types";
import { gmailTriggerChannel } from "@/inngest/channels/gmail-trigger";

type GmailTriggerData = Record<string, unknown>;

export const gmailTriggerExecutor: NodeExecutor<GmailTriggerData> =
    async ({
        nodeId,
        context,
        step,
        publish,
    }) => {
        await publish(
            gmailTriggerChannel().status({
                nodeId,
                status: "loading",
            }),
        );

        const result = await step.run(
            "gmail-trigger",
            async () => context,
        );

        await publish(
            gmailTriggerChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    };