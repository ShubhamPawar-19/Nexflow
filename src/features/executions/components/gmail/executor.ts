import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NodeExecutor } from "@/features/executions/types";
import { sendGmailEmail } from "./client";
import { gmailChannel } from "@/inngest/channels/gmail";

type GmailData = {
    credentialId?: string;
    to?: string;
    subject?: string;
    body?: string;
    variableName?: string;
};

type GmailCredential = {
    accessToken: string;
    refreshToken: string;
    email: string;
};

export const gmailExecutor: NodeExecutor = async ({
    data,
    nodeId,
    userId,
    context,
    step,
    publish,
}) => {
    await publish(
        gmailChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    try {
        const result = await step.run("gmail-send-email", async () => {
            const nodeData = data as GmailData;

            if (!nodeData.credentialId) {
                throw new NonRetriableError(
                    "Gmail node: Credential is not configured",
                );
            }

            if (!nodeData.to) {
                throw new NonRetriableError(
                    "Gmail node: Recipient is not configured",
                );
            }

            if (!nodeData.subject) {
                throw new NonRetriableError(
                    "Gmail node: Subject is not configured",
                );
            }

            if (!nodeData.body) {
                throw new NonRetriableError(
                    "Gmail node: Body is not configured",
                );
            }

            if (!nodeData.variableName) {
                throw new NonRetriableError(
                    "Gmail node: Variable name is not configured",
                );
            }
            const credential = await prisma.credential.findFirst({
                where: {
                    id: nodeData.credentialId,
                    userId,
                    type: "GMAIL",
                },
            });

            if (!credential) {
                throw new NonRetriableError(
                    "Gmail node: Credential not found",
                );
            }

            let gmailCredential: GmailCredential;

            try {
                gmailCredential = JSON.parse(
                    decrypt(credential.value),
                ) as GmailCredential;
            } catch {
                throw new NonRetriableError(
                    "Gmail node: Invalid credential configuration",
                );
            }

            if (
                !gmailCredential.accessToken ||
                !gmailCredential.refreshToken
            ) {
                throw new NonRetriableError(
                    "Gmail node: Credential is incomplete",
                );
            }

            const to = Handlebars.compile(nodeData.to)(context);
            const subject = Handlebars.compile(nodeData.subject)(context);
            const body = Handlebars.compile(nodeData.body)(context);

            if (!to.trim()) {
                throw new NonRetriableError(
                    "Gmail node: Recipient resolved to an empty value",
                );
            }

            if (!subject.trim()) {
                throw new NonRetriableError(
                    "Gmail node: Subject resolved to an empty value",
                );
            }

            if (!body.trim()) {
                throw new NonRetriableError(
                    "Gmail node: Body resolved to an empty value",
                );
            }

            const response = await sendGmailEmail({
                accessToken: gmailCredential.accessToken,
                refreshToken: gmailCredential.refreshToken,
                to,
                subject,
                body,
            });

            return {
                ...context,
                [nodeData.variableName]: {
                    messageId: response.id,
                    threadId: response.threadId,
                    from: gmailCredential.email,
                    to,
                    subject,
                },
            };
        });

        await publish(
            gmailChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    } catch (error) {
        await publish(
            gmailChannel().status({
                nodeId,
                status: "error",
            }),
        );

        throw error;
    }
};