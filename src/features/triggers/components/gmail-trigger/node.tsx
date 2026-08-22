"use client";

import { memo, useState } from "react";
import { NodeProps } from "@xyflow/react";
import { useAtomValue } from "jotai";

import { BaseTriggerNode } from "../base-trigger-node";

import { useNodeStatus } from "@/features/executions/hooks/use-node-status";

import {
    fetchGmailTriggerRealtimeToken,
} from "./actions";
import { editorAtom } from "@/features/editor/store/atom";
import { GMAIL_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/gmail-trigger";
import { GmailTriggerDialog } from "./dialog";


type GmailTriggerData = {
    credentialId?: string;
};

export const GmailTriggerNode = memo((props: NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const editor = useAtomValue(editorAtom);

    const nodeData = props.data as GmailTriggerData;

    const nodeStatus = useNodeStatus({
        nodeId: props.id,
        channel: GMAIL_TRIGGER_CHANNEL_NAME,
        topic: "status",
        refreshToken: fetchGmailTriggerRealtimeToken,
    });

    const handleOpenSettings = () => {
        setDialogOpen(true);
    };

    const handleSubmit = (values: GmailTriggerData) => {
        if (!editor) return;

        editor.setNodes((nodes) =>
            nodes.map((node) => {
                if (node.id !== props.id) {
                    return node;
                }

                return {
                    ...node,
                    data: {
                        ...node.data,
                        credentialId: values.credentialId,
                    },
                };
            }),
        );
    };

    return (
        <>
            <GmailTriggerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                defaultValues={{
                    credentialId: nodeData.credentialId,
                }}
                onSubmit={handleSubmit}
            />

            <BaseTriggerNode
                {...props}
                icon="/logos/gmail.svg"
                name="Gmail"
                description="When a new email arrives"
                status={nodeStatus}
                onSettings={handleOpenSettings}
                onDoubleClick={handleOpenSettings}
            />
        </>
    );
});

GmailTriggerNode.displayName = "GmailTriggerNode";