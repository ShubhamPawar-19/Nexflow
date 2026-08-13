import { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";

import { BaseTriggerNode } from "../base-trigger-node";
import { WhatsAppTriggerDialog } from "./dialog";

import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { WHATSAPP_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/whatsapp-trigger";
import { fetchWhatsAppTriggerRealtimeToken } from "./actions";

export const WhatsAppTriggerNode = memo((props: NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: WHATSAPP_TRIGGER_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchWhatsAppTriggerRealtimeToken,
    });

    const handleOpenSettings = () => setDialogOpen(true);

    return (
        <>
            <WhatsAppTriggerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <BaseTriggerNode
                {...props}
                icon="/logos/whatsapp.svg"
                name="WhatsApp"
                description="When a WhatsApp message is received"
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    );
});