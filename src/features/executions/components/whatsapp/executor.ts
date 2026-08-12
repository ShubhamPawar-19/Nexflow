import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import type { NodeExecutor } from "@/features/executions/types";
import { whatsappChannel } from "@/inngest/channels/whatsapp";
import { sendWhatsAppText } from "./client";

type WhatsAppData = {
    credentialId?: string;
    recipient?: string;
    message?: string;
};

type WhatsAppCredential = {
    accessToken: string;
    phoneNumberId: string;
};

export const whatsappExecutor: NodeExecutor = async ({
    data,
    nodeId,
    userId,
    context,
    step,
    publish,
}) => {
    await publish(
        whatsappChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    try {
        const result = await step.run("whatsapp-send-message", async () => {
            const nodeData = data as WhatsAppData;

            if (!nodeData.credentialId) {
                throw new NonRetriableError(
                    "WhatsApp node: Credential is not configured",
                );
            }

            if (!nodeData.recipient) {
                throw new NonRetriableError(
                    "WhatsApp node: Recipient is not configured",
                );
            }

            if (!nodeData.message) {
                throw new NonRetriableError(
                    "WhatsApp node: Message is not configured",
                );
            }

            const credential = await prisma.credential.findFirst({
                where: {
                    id: nodeData.credentialId,
                    userId,
                    type: "WHATSAPP",
                },
            });

            if (!credential) {
                throw new NonRetriableError(
                    "WhatsApp node: Credential not found",
                );
            }

            let whatsappCredential: WhatsAppCredential;

            try {
                whatsappCredential = JSON.parse(
                    decrypt(credential.value),
                ) as WhatsAppCredential;
            } catch {
                throw new NonRetriableError(
                    "WhatsApp node: Invalid credential configuration",
                );
            }

            if (
                !whatsappCredential.accessToken ||
                !whatsappCredential.phoneNumberId
            ) {
                throw new NonRetriableError(
                    "WhatsApp node: Credential is incomplete",
                );
            }

            const recipient = Handlebars.compile(
                nodeData.recipient,
            )(context);

            const message = Handlebars.compile(
                nodeData.message,
            )(context);

            if (!recipient.trim()) {
                throw new NonRetriableError(
                    "WhatsApp node: Recipient resolved to an empty value",
                );
            }

            if (!message.trim()) {
                throw new NonRetriableError(
                    "WhatsApp node: Message resolved to an empty value",
                );
            }

            const response = await sendWhatsAppText({
                accessToken: whatsappCredential.accessToken,
                phoneNumberId: whatsappCredential.phoneNumberId,
                to: recipient,
                message,
            });

            return {
                ...context,
                whatsapp: {
                    messageId: response.messages?.[0]?.id,
                    recipient,
                    response,
                },
            };
        });

        await publish(
            whatsappChannel().status({
                nodeId,
                status: "success",
            }),
        );

        return result;
    } catch (error) {
        await publish(
            whatsappChannel().status({
                nodeId,
                status: "error",
            }),
        );

        throw error;
    }
};