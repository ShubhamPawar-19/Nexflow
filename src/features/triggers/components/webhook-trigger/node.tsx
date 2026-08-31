"use client";

import { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";
import { BaseTriggerNode } from "../base-trigger-node";
import { WebhookTriggerDialog } from "./dialog";

export const WebhookTriggerNode = memo((props: NodeProps) => {
const [dialogOpen, setDialogOpen] = useState(false);


const handleOpenSettings = () => {
    setDialogOpen(true);
};

return (
    <>
        <WebhookTriggerDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            nodeId={props.id}
        />

        <BaseTriggerNode
            {...props}
            icon="/logos/webhook.svg"
            name="Webhook"
            description="When an HTTP request is received"
            onSettings={handleOpenSettings}
            onDoubleClick={handleOpenSettings}
        />
    </>
);


});

WebhookTriggerNode.displayName = "WebhookTriggerNode";
