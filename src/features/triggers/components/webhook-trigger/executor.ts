import type { NodeExecutor } from "@/features/executions/types";
import { webhookTriggerChannel } from "@/inngest/channels/webhook-trigger";

export const webhookTriggerExecutor: NodeExecutor = async ({
    nodeId,
    context,
    step,
    publish,
}) => {
    await publish(
        webhookTriggerChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    try {
        const result = await step.run(
            "webhook-trigger",
            async () => context,
        );

        await publish(
            webhookTriggerChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    } catch (error) {
        await publish(
            webhookTriggerChannel().status({
                nodeId,
                status: "error",
            }),
        );

        throw error;
    }
};