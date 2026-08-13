import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { inngest } from "@/inngest/client";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (
        mode === "subscribe" &&
        token === process.env.WHATSAPP_VERIFY_TOKEN
    ) {
        return new NextResponse(challenge);
    }

    return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        console.log(
            "WhatsApp webhook received:",
            JSON.stringify(body, null, 2)
        );

        if (body.object !== "whatsapp_business_account") {
            return NextResponse.json({ received: true });
        }

        for (const entry of body.entry ?? []) {
            for (const change of entry.changes ?? []) {
                if (change.field !== "messages") {
                    continue;
                }

                const value = change.value;

                for (const message of value.messages ?? []) {
                    if (message.type !== "text") {
                        continue;
                    }

                    const phoneNumberId =
                        value.metadata?.phone_number_id;

                    const from = message.from;
                    const messageId = message.id;
                    const timestamp = message.timestamp;
                    const text = message.text?.body;

                    if (!phoneNumberId || !from || !messageId || !text) {
                        continue;
                    }

                    console.log("WhatsApp message:", {
                        from,
                        text,
                        messageId,
                        phoneNumberId,
                    });

                    const workflows = await prisma.workflow.findMany({
                        where: {
                            nodes: {
                                some: {
                                    type: "WHATSAPP_TRIGGER",
                                },
                            },
                        },
                        include: {
                            nodes: {
                                where: {
                                    type: "WHATSAPP_TRIGGER",
                                },
                            },
                        },
                    });

                    for (const workflow of workflows) {
                        await inngest.send({
                            name: "workflows/execute.workflow",
                            data: {
                                workflowId: workflow.id,
                                initialData: {
                                    whatsapp: {
                                        message: text,
                                        from,
                                        messageId,
                                        phoneNumberId,
                                        timestamp,
                                        type: message.type,
                                    },
                                },
                            },
                        });
                    }
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("WhatsApp webhook error:", error);

        return NextResponse.json(
            { error: "Invalid webhook payload" },
            { status: 400 }
        );
    }
}