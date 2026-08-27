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

        // Process notifications for the same Gmail account
        // sequentially.
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
            historyId: notificationHistoryId,
        } = event.data as GmailNotificationData;

        console.log("GMAIL PROCESS START", {
            eventId: event.id,
            credentialId,
            notificationHistoryId,
            timestamp: new Date().toISOString(),
        });

        if (!credentialId || !notificationHistoryId) {
            throw new NonRetriableError(
                "Gmail credentialId or historyId is missing",
            );
        }

        // --------------------------------------------------
        // 1. Get Gmail credential + current history cursor
        // --------------------------------------------------

        const credential = await step.run(
            "get-gmail-credential",
            async () => {
                const result =
                    await prisma.credential.findUnique({
                        where: {
                            id: credentialId,
                            type: "GMAIL",
                        },
                        select: {
                            id: true,
                            value: true,
                            gmailHistoryId: true,
                        },
                    });

                if (!result) {
                    throw new NonRetriableError(
                        `Gmail credential ${credentialId} not found`,
                    );
                }

                if (!result.gmailHistoryId) {
                    throw new NonRetriableError(
                        "Gmail history ID is missing",
                    );
                }

                console.log("GMAIL CURSOR DEBUG", {
                    credentialId,
                    storedHistoryId:
                        result.gmailHistoryId,
                    notificationHistoryId,
                });

                return result;
            },
        );

        // --------------------------------------------------
        // 2. Get Gmail history
        // --------------------------------------------------

        const historyResult = await step.run(
            "get-gmail-history",
            async () => {
                try {
                    return await getGmailHistory(
                        credential.value,
                        credential.gmailHistoryId!,
                    );
                } catch (error: any) {
                    console.error(
                        "GMAIL HISTORY ERROR",
                        {
                            credentialId,
                            historyId:
                                credential.gmailHistoryId,
                            error,
                        },
                    );

                    throw error;
                }
            },
        );

        // --------------------------------------------------
        // 3. Extract unique newly-added message IDs
        // --------------------------------------------------

        const messageIds = [
            ...new Set(
                (
                    historyResult.history?.flatMap(
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
            requestedFrom:
                credential.gmailHistoryId,
            returnedHistoryId:
                historyResult.historyId,
            notificationHistoryId,
        });

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
                    select: {
                        id: true,
                    },
                });
            },
        );

        console.log(
            `Found ${workflows.length} active Gmail workflow(s)`,
        );

        // --------------------------------------------------
        // 5. Process each Gmail message
        // --------------------------------------------------

        for (const messageId of messageIds) {
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

            console.log("GMAIL MESSAGE DEBUG", {
                id: message.id,
                threadId: message.threadId,
                labelIds: message.labelIds,
                snippet: message.snippet,
            });

            // ----------------------------------------------
            // Ignore messages sent by the user
            // ----------------------------------------------

            if (message.labelIds?.includes("SENT")) {
                console.log(
                    `Skipping sent Gmail message: ${messageId}`,
                );

                continue;
            }

            // ----------------------------------------------
            // Check if message was already processed
            // ----------------------------------------------

            const alreadyProcessed = await step.run(
                `check-gmail-message-${messageId}`,
                async () => {
                    const existing =
                        await prisma.gmailProcessedMessage.findUnique(
                            {
                                where: {
                                    credentialId_messageId: {
                                        credentialId,
                                        messageId,
                                    },
                                },
                                select: {
                                    id: true,
                                },
                            },
                        );

                    return Boolean(existing);
                },
            );

            if (alreadyProcessed) {
                console.log(
                    "GMAIL MESSAGE ALREADY PROCESSED",
                    {
                        credentialId,
                        messageId,
                    },
                );

                continue;
            }

            // ----------------------------------------------
            // Send workflow events
            // ----------------------------------------------

            for (const workflow of workflows) {
                await step.run(
                    `start-gmail-workflow-${workflow.id}-${messageId}`,
                    async () => {
                        const idempotencyId =
                            `gmail-${credentialId}-${messageId}-${workflow.id}`;

                        const eventResult =
                            await sendWorkflowExecution({
                                id: idempotencyId,
                                workflowId: workflow.id,
                                initialData: {
                                    gmail: {
                                        messageId:
                                            message.id,
                                        threadId:
                                            message.threadId,
                                        snippet:
                                            message.snippet,
                                        historyId:
                                            notificationHistoryId,
                                        emailAddress,
                                        message,
                                    },
                                },
                            });

                        console.log(
                            "GMAIL WORKFLOW EVENT SENT",
                            {
                                workflowId:
                                    workflow.id,
                                messageId,
                                eventIds:
                                    eventResult.ids,
                                idempotencyId,
                            },
                        );

                        return eventResult;
                    },
                );
            }

            // ----------------------------------------------
            // Mark Gmail message as processed
            // ----------------------------------------------

            await step.run(
                `mark-gmail-message-processed-${messageId}`,
                async () => {
                    try {
                        await prisma.gmailProcessedMessage.create(
                            {
                                data: {
                                    credentialId,
                                    messageId,
                                },
                            },
                        );

                        console.log(
                            "GMAIL MESSAGE MARKED PROCESSED",
                            {
                                credentialId,
                                messageId,
                            },
                        );
                    } catch (error: any) {
                        // Unique constraint means another
                        // execution already processed it.
                        if (error?.code === "P2002") {
                            console.log(
                                "GMAIL MESSAGE ALREADY MARKED PROCESSED",
                                {
                                    credentialId,
                                    messageId,
                                },
                            );

                            return;
                        }

                        throw error;
                    }
                },
            );
        }

        // --------------------------------------------------
        // 6. Advance Gmail history cursor
        // --------------------------------------------------

        const returnedHistoryId =
            historyResult.historyId;

        if (!returnedHistoryId) {
            console.log(
                "GMAIL NO HISTORY ID RETURNED",
                {
                    credentialId,
                    notificationHistoryId,
                },
            );

            return {
                success: true,
                emailAddress,
                notificationHistoryId,
                messageIds,
                workflowCount: workflows.length,
            };
        }

        await step.run(
            "update-gmail-history",
            async () => {
                const current =
                    await prisma.credential.findUnique({
                        where: {
                            id: credentialId,
                        },
                        select: {
                            gmailHistoryId: true,
                        },
                    });

                if (!current?.gmailHistoryId) {
                    return;
                }

                const currentId = BigInt(
                    current.gmailHistoryId,
                );

                const newId = BigInt(
                    String(returnedHistoryId),
                );

                console.log("GMAIL CURSOR COMPARE", {
                    credentialId,
                    current:
                        current.gmailHistoryId,
                    returned:
                        String(returnedHistoryId),
                });

                // Never move cursor backwards.
                if (newId <= currentId) {
                    console.log(
                        "GMAIL CURSOR NOT MOVED",
                        {
                            credentialId,
                            current:
                                current.gmailHistoryId,
                            attempted:
                                String(
                                    returnedHistoryId,
                                ),
                        },
                    );

                    return;
                }

                const updated =
                    await prisma.credential.update({
                        where: {
                            id: credentialId,
                        },
                        data: {
                            gmailHistoryId:
                                String(
                                    returnedHistoryId,
                                ),
                        },
                        select: {
                            gmailHistoryId: true,
                        },
                    });

                console.log(
                    "GMAIL CURSOR UPDATED",
                    {
                        credentialId,
                        gmailHistoryId:
                            updated.gmailHistoryId,
                    },
                );

                return updated;
            },
        );

        return {
            success: true,
            emailAddress,
            notificationHistoryId,
            messageIds,
            workflowCount: workflows.length,
        };
    },
);