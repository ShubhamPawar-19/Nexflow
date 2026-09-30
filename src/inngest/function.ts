import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { executionStatus, NodeType } from "@/generated/prisma/enums";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { geminiChannel } from "./channels/gemini";
import { openAiChannel } from "./channels/openai";
import { anthropicChannel } from "./channels/anthropic";
import { discordChannel } from "./channels/discord";
import { slackChannel } from "./channels/slack";
import { whatsappChannel } from "./channels/whatsapp";
import { whatsappTriggerChannel } from "./channels/whatsapp-trigger";
import { gmailTriggerChannel } from "./channels/gmail-trigger";
import { gmailChannel } from "./channels/gmail";
import { webhookTriggerChannel } from "./channels/webhook-trigger";
import { ifElseChannel } from "./channels/if-else";

export const executeWorkflow = inngest.createFunction(
    {
        id: "execute-workflow",
        retries:
            process.env.NODE_ENV === "production" ? 3 : 0,

        onFailure: async ({ event }) => {
            return prisma.execution.update({
                where: {
                    inngestEventId: event.data.event.id,
                },
                data: {
                    status: executionStatus.FAILED,
                    error: event.data.error.message,
                    errorStack: event.data.error.stack,
                },
            });
        },
    },
    {
        event: "workflows/execute.workflow",

        channels: [
            httpRequestChannel(),
            manualTriggerChannel(),
            googleFormTriggerChannel(),
            stripeTriggerChannel(),
            geminiChannel(),
            openAiChannel(),
            anthropicChannel(),
            discordChannel(),
            slackChannel(),
            whatsappChannel(),
            whatsappTriggerChannel(),
            gmailChannel(),
            gmailTriggerChannel(),
            webhookTriggerChannel(),
            ifElseChannel(),
        ],
    },

    async ({ event, step, publish }) => {
        const inngestEventId = event.id;
        const workflowId = event.data.workflowId;

        if (!inngestEventId || !workflowId) {
            throw new NonRetriableError(
                "Event ID or Workflow ID is missing",
            );
        }

        await step.run("create-execution", async () => {
            return prisma.execution.upsert({
                where: {
                    inngestEventId,
                },
                create: {
                    workflowId,
                    inngestEventId,
                },
                update: {},
            });
        });

        /**
         * Load the workflow and convert it into JSON-safe
         * runtime data.
         */
        const workflow = await step.run(
            "prepare-workflow",
            async () => {
                const workflow =
                    await prisma.workflow.findUniqueOrThrow({
                        where: {
                            id: workflowId,
                        },
                        include: {
                            nodes: true,
                            connections: true,
                        },
                    });

                const sortedNodes = topologicalSort(
                    workflow.nodes,
                    workflow.connections,
                );

                return {
                    nodes: sortedNodes.map((node) => ({
                        id: node.id,
                        name: node.name,
                        type: node.type,
                        data: node.data,
                    })),

                    connections: workflow.connections.map(
                        (connection) => ({
                            id: connection.id,
                            fromNodeId:
                                connection.fromNodeId,
                            toNodeId:
                                connection.toNodeId,
                            fromOutput:
                                connection.fromOutput,
                            toInput:
                                connection.toInput,
                        }),
                    ),
                };
            },
        );

        const userId = await step.run(
            "find-user-id",
            async () => {
                const workflow =
                    await prisma.workflow.findFirstOrThrow({
                        where: {
                            id: workflowId,
                        },
                        select: {
                            userId: true,
                        },
                    });

                return workflow.userId;
            },
        );

        let context = event.data.initialData || {};

        const executedNodes = new Set<string>();

        const selectedBranches = new Map<
            string,
            "true" | "false"
        >();

        console.log(
            "WORKFLOW EXECUTION ORDER:",
            workflow.nodes.map((node) => ({
                id: node.id,
                type: node.type,
            })),
        );
console.log(
    "WORKFLOW CONNECTIONS:",
    workflow.connections.map((connection) => ({
        fromNodeId: connection.fromNodeId,
        toNodeId: connection.toNodeId,
        fromOutput: connection.fromOutput,
        toInput: connection.toInput,
    })),
);
        for (const node of workflow.nodes) {
            console.log(
    "VISITING NODE:",
    node.id,
    node.type,
);

            /**
             * Find all incoming connections for this node.
             */
            const incomingConnections =
                workflow.connections.filter(
                    (connection) =>
                        connection.toNodeId === node.id,
                );

            /**
             * Nodes with no incoming connections are entry nodes.
             */
            if (incomingConnections.length === 0) {
                executedNodes.add(node.id);
            } else {
                /**
                 * A node should execute if at least one valid
                 * incoming path reaches it.
                 */
                let shouldExecute = false;

                for (const connection of incomingConnections) {
                    const sourceNodeId =
                        connection.fromNodeId;

                    /**
                     * The source node itself must have executed.
                     */
                    if (!executedNodes.has(sourceNodeId)) {
                        continue;
                    }

                    /**
                     * Find the source node.
                     */
                    const sourceNode = workflow.nodes.find(
                        (workflowNode) =>
                            workflowNode.id === sourceNodeId,
                    );

                    if (!sourceNode) {
                        continue;
                    }

                    /**
                     * If the source is an If/Else node,
                     * respect its selected branch.
                     */
                    if (sourceNode.type === NodeType.IF_ELSE) {
    const selectedBranch =
        selectedBranches.get(sourceNodeId);

    if (
        selectedBranch === connection.fromOutput
    ) {
        shouldExecute = true;
        break;
    }

    continue;
}

// For normal nodes/triggers, the connection is valid
// as long as the source node has executed.
// Output IDs such as "source-1" are valid here.
shouldExecute = true;
break;
                }

                if (!shouldExecute) {
                    /**
                     * This node belongs to an inactive branch.
                     *
                     * Do not execute it.
                     */
                    continue;
                }

                executedNodes.add(node.id);
            }

            const executor = getExecutor(
                node.type as NodeType,
            );

            context = await executor({
                data: node.data as Record<string, unknown>,
                nodeId: node.id,
                userId,
                context,
                step,
                publish,
            });
console.log(
    "NODE RESULT:",
    {
        nodeId: node.id,
        nodeType: node.type,
        branch:
            node.type === NodeType.IF_ELSE
                ? (context as Record<string, unknown>).__branch
                : undefined,
    },
);
            /**
             * If this was an If/Else node, remember which
             * branch it selected.
             */
            if (node.type === NodeType.IF_ELSE) {
                const branch =
                    (context as Record<string, unknown>)
                        .__branch;

                if (
                    branch === "true" ||
                    branch === "false"
                ) {
                    selectedBranches.set(
                        node.id,
                        branch,
                    );
                }
            }
        }

        await step.run("update-execution", async () => {
            return prisma.execution.update({
                where: {
                    inngestEventId,
                    workflowId,
                },
                data: {
                    status: executionStatus.SUCCESS,
                    completedAt: new Date(),
                    output: context,
                },
            });
        });

        return {
            workflowId,
            result: context,
        };
    },
);
