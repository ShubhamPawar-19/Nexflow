"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";

import { BaseExecutionNode } from "../base-execution-node";
import { GmailDialog, GmailFormValues } from "./dialog";

import { useNodeStatus } from "../../hooks/use-node-status";

import { GMAIL_CHANNEL_NAME } from "@/inngest/channels/gmail";
import { fetchGmailRealtimeToken } from "./actions";

type GmailNodeData = {
    variableName?: string;
    credentialId?: string;
    to?: string;
    subject?: string;
    body?: string;
};

type GmailNodeType = Node<GmailNodeData>;

export const GmailNode = memo(
    (props: NodeProps<GmailNodeType>) => {
        const [dialogOpen, setDialogOpen] = useState(false);

        const { setNodes } = useReactFlow();

        const nodeStatus = useNodeStatus({
            nodeId: props.id,
            channel: GMAIL_CHANNEL_NAME,
            topic: "status",
            refreshToken: fetchGmailRealtimeToken,
        });

        const handleOpenSettings = () => {
            setDialogOpen(true);
        };

        const handleSubmit = (values: GmailFormValues) => {
            setNodes((nodes) =>
                nodes.map((node) => {
                    if (node.id === props.id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                ...values,
                            },
                        };
                    }

                    return node;
                }),
            );
        };

        const nodeData = props.data;

        const description = nodeData?.subject
            ? `${nodeData.subject.slice(0, 50)}${
                  nodeData.subject.length > 50 ? "..." : ""
              }`
            : "Not configured";

        return (
            <>
                <GmailDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSubmit={handleSubmit}
                    defaultValues={nodeData}
                />

                <BaseExecutionNode
                    {...props}
                    id={props.id}
                    icon="/logos/gmail.svg"
                    name="Gmail"
                    status={nodeStatus}
                    description={description}
                    onSettings={handleOpenSettings}
                    onDoubleClick={handleOpenSettings}
                />
            </>
        );
    },
);

GmailNode.displayName = "GmailNode";