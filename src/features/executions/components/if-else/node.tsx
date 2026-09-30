"use client";

import {
    type Node,
    type NodeProps,
    Position,
    useReactFlow,
} from "@xyflow/react";
import { GitBranchIcon } from "lucide-react";
import { memo, useState } from "react";

import { BaseExecutionNode } from "../base-execution-node";
import { IfElseDialog, IfElseFormValues } from "./dialog";

import { useNodeStatus } from "../../hooks/use-node-status";

import { IF_ELSE_CHANNEL_NAME } from "@/inngest/channels/if-else";
import { fetchIfElseRealtimeToken } from "./actions";

import { BaseHandle } from "@/components/react-flow/base-handle";

type IfElseOperator =
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "greater_than_or_equal"
    | "less_than_or_equal"
    | "is_empty"
    | "is_not_empty"
    | "starts_with"
    | "ends_with";

export type IfElseNodeData = {
    conditions?: {
        leftValue: string;
        operator: IfElseOperator;
        rightValue?: string;
    }[];
    logicalOperator?: "AND" | "OR";
};

type IfElseNodeType = Node<IfElseNodeData>;

export const IfElseNode = memo(
    (props: NodeProps<IfElseNodeType>) => {
        const [dialogOpen, setDialogOpen] = useState(false);

        const { setNodes, setEdges } = useReactFlow();

        const nodeStatus = useNodeStatus({
            nodeId: props.id,
            channel: IF_ELSE_CHANNEL_NAME,
            topic: "status",
            refreshToken: fetchIfElseRealtimeToken,
        });

        const handleOpenSettings = () => {
            setDialogOpen(true);
        };

        const handleSubmit = (values: IfElseFormValues) => {
            setNodes((nodes) =>
                nodes.map((node) => {
                    if (node.id !== props.id) {
                        return node;
                    }

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...values,
                        },
                    };
                }),
            );
        };

        const handleDelete = () => {
            setNodes((nodes) =>
                nodes.filter((node) => node.id !== props.id),
            );

            setEdges((edges) =>
                edges.filter(
                    (edge) =>
                        edge.source !== props.id &&
                        edge.target !== props.id,
                ),
            );
        };

        const conditions = props.data?.conditions ?? [];
        const logicalOperator =
            props.data?.logicalOperator ?? "AND";

        const firstCondition = conditions[0];

        const description = firstCondition
            ? `${firstCondition.leftValue} ${firstCondition.operator.replaceAll(
                "_",
                " ",
            )}${firstCondition.rightValue
                ? ` ${firstCondition.rightValue}`
                : ""
            }${conditions.length > 1
                ? ` (${logicalOperator})`
                : ""
            }`
            : "Not configured";

        return (
            <>
                <IfElseDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSubmit={handleSubmit}
                    defaultValues={props.data}
                />

                <div className="relative">
                    <BaseExecutionNode
                        {...props}
                        id={props.id}
                        icon={GitBranchIcon}
                        name="If / Else"
                        status={nodeStatus}
                        description={description}
                        onSettings={handleOpenSettings}
                        onDoubleClick={handleOpenSettings}
                        showDefaultSource={false}
                    />
                    <BaseHandle
                        id="true"
                        type="source"
                        position={Position.Right}
                        style={{
                            top: "35%",
                        }}
                    />

                    <BaseHandle
                        id="false"
                        type="source"
                        position={Position.Right}
                        style={{
                            top: "65%",
                        }}
                    />
                </div>
            </>
        );
    },
);

IfElseNode.displayName = "IfElseNode";