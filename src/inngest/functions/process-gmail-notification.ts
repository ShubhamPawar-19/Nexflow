import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { getGmailHistory } from "@/lib/gmail/history";
import { getGmailMessage } from "@/lib/gmail/message";
import { sendWorkflowExecution } from "@/inngest/utils";
import { NonRetriableError } from "inngest";

type GmailNotificationData = {
    credentialId: string;
    emailAddress: string;
    historyId: string;
};

export const processGmailNotification = inngest.createFunction(
    {
        id: "process-gmail-notification",
        retries: 3,
        concurrency: {
            limit: 1,
            key: "event.data.credentialId",
        },
    },
    {
        event: "gmail/notification.received",
    },
    async ({ event, step }) => {
        const {
            credentialId,
            emailAddress,
            historyId,
        } = event.data as GmailNotificationData;

        if (!credentialId || !historyId) {
            throw new NonRetriableError(
                "Gmail credentialId or historyId is missing",
            );
        }

        // --------------------------------------------------
        // 1. Get Gmail credential
        // --------------------------------------------------

        const credential = await step.run(
            "get-gmail-credential",
            async () => {
                return prisma.credential.findUnique({
                    where: {
                        id: credentialId,
                        type: "GMAIL",
                    },
                });
            },
        );

        if (!credential) {
            throw new NonRetriableError(
                `Gmail credential ${credentialId} not found`,
            );
        }

        if (!credential.gmailHistoryId) {
            throw new NonRetriableError(
                "Gmail history ID is missing",
            );
        }
        console.log("GMAIL CURSOR DEBUG", {
            credentialId,
            storedHistoryId: credential.gmailHistoryId,
            notificationHistoryId: historyId,
        });

        // --------------------------------------------------
        // 2. Get Gmail history
        // --------------------------------------------------

        const history = await step.run(
            "get-gmail-history",
            async () => {
                return getGmailHistory(
                    credential.value,
                    credential.gmailHistoryId!,
                );
            },
        );

        const messageIds = [
            ...new Set(
                (
                    history.history?.flatMap(
                        (item) =>
                            item.messagesAdded?.map(
                                (message) =>
                                    message.message?.id,
                            ) ?? [],
                    ) ?? []
                ).filter(
                    (id): id is string => Boolean(id),
                ),
            ),
        ];

        console.log(
            `Found ${messageIds.length} new Gmail message(s)`,
        );

        console.log("GMAIL HISTORY RESULT", {
            requestedFrom: credential.gmailHistoryId,
            returnedHistoryId: history.historyId,
            notificationHistoryId: historyId,
        });
        // --------------------------------------------------
        // 3. No messages
        // --------------------------------------------------

        if (messageIds.length === 0) {
            await step.run(
                "update-gmail-history",
                async () => {
                    return prisma.credential.update({
                        where: {
                            id: credentialId,
                        },
                        data: {
                            gmailHistoryId: String(history.historyId),
                        },
                    });
                },
            );

            return {
                success: true,
                messageIds: [],
            };
        }

        // --------------------------------------------------
        // 4. Get active Gmail workflows
        // --------------------------------------------------

        const workflows = await step.run(
            "find-gmail-workflows",
            async () => {
                return prisma.workflow.findMany({
                    where: {
                        isActive: true,
                        nodes: {
                            some: {
                                type: "GMAIL_TRIGGER",
                                credentialId,
                            },
                        },
                    },
                });
            },
        );

        console.log(
            `Found ${workflows.length} active Gmail workflow(s)`,
        );

        // --------------------------------------------------
        // 5. Process each message
        // --------------------------------------------------

        for (const messageId of messageIds) {
            // ----------------------------------------------
            // ATOMIC DEDUPLICATION
            // ----------------------------------------------

            const processed = await step.run(
                `deduplicate-gmail-message-${messageId}`,
                async () => {
                    try {
                        return await prisma.gmailProcessedMessage.create(
                            {
                                data: {
                                    credentialId,
                                    messageId,
                                },
                            },
                        );
                    } catch (error: any) {
                        // Prisma unique constraint = already processed
                        if (error?.code === "P2002") {
                            return null;
                        }

                        throw error;
                    }
                },
            );

            // Already processed by another notification
            if (!processed) {
                console.log(
                    `Skipping already processed Gmail message: ${messageId}`,
                );

                continue;
            }

            // ----------------------------------------------
            // Get actual Gmail message
            // ----------------------------------------------

            const message = await step.run(
                `get-gmail-message-${messageId}`,
                async () => {
                    return getGmailMessage(
                        credentialId,
                        messageId,
                    );
                },
            );

            console.log(
                "Gmail message received:",
                {
                    id: message.id,
                    threadId: message.threadId,
                    snippet: message.snippet,
                },
            );

            // ----------------------------------------------
            // Start matching workflows
            // ----------------------------------------------
            for (const workflow of workflows) {
                await step.run(
                    `start-gmail-workflow-${workflow.id}-${messageId}`,
                    async () => {
                        const eventId = await sendWorkflowExecution({
                            workflowId: workflow.id,
                            initialData: {
                                gmail: {
                                    messageId: message.id,
                                    threadId: message.threadId,
                                    snippet: message.snippet,
                                    historyId,
                                    emailAddress,
                                    message,
                                },
                            },
                        });

                        console.log(
                            `Started Gmail workflow ${workflow.id} for message ${messageId}`,
                            {
                                eventId,
                                messageId,
                            },
                        );

                        return eventId;
                    },
                );
            }
        }
        // --------------------------------------------------
        // 6. Move Gmail cursor forward
        // --------------------------------------------------

        console.log("ABOUT TO UPDATE GMAIL CURSOR", {
    credentialId,
    from: credential.gmailHistoryId,
    to: history.historyId,
});

await step.run(
    "update-gmail-history",
    async () => {
        const updated = await prisma.credential.update({
            where: {
                id: credentialId,
            },
            data: {
                gmailHistoryId: String(history.historyId),
            },
        });

        console.log("GMAIL CURSOR UPDATED", {
            credentialId: updated.id,
            gmailHistoryId: updated.gmailHistoryId,
        });

        return updated;
    },
);

        return {
            success: true,
            emailAddress,
            historyId,
            messageIds,
            workflowCount: workflows.length,
        };
    },
);