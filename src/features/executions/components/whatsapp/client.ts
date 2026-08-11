import ky from "ky";

const WHATSAPP_API_VERSION = "v23.0";
const WHATSAPP_API_BASE_URL =
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

export interface WhatsAppCredentials {
    accessToken: string;
    phoneNumberId: string;
}

export interface SendWhatsAppTextParams {
    accessToken: string;
    phoneNumberId: string;
    to: string;
    message: string;
}

export const sendWhatsAppText = async ({
    accessToken,
    phoneNumberId,
    to,
    message,
}: SendWhatsAppTextParams) => {
    return ky
        .post(`${WHATSAPP_API_BASE_URL}/${phoneNumberId}/messages`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            json: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to,
                type: "text",
                text: {
                    preview_url: false,
                    body: message,
                },
            },
        })
        .json<{
            messaging_product: string;
            contacts?: Array<{
                input: string;
                wa_id: string;
            }>;
            messages?: Array<{
                id: string;
            }>;
        }>();
};