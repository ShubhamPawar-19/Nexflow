import prisma from "@/lib/db";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

type GmailPubSubNotification = {
    emailAddress: string;
    historyId: string;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const encodedData = body?.message?.data;

        if (!encodedData) {
            console.error("Missing Pub/Sub message data");

            return NextResponse.json(
                { success: false },
                { status: 400 },
            );
        }

        const decodedData = Buffer.from(
            encodedData,
            "base64",
        ).toString("utf-8");

        const notification =
            JSON.parse(decodedData) as GmailPubSubNotification;

        console.log("Gmail notification:", notification);

        const credential = await prisma.credential.findFirst({
            where: {
                type: "GMAIL",
                accountEmail: notification.emailAddress,
            },
            select: {
                id: true,
            },
        });

        if (!credential) {
            console.log(
                `No Gmail credential found for ${notification.emailAddress}`,
            );

            return NextResponse.json({ success: true });
        }

        console.log("GMAIL EVENT SEND", {
            credentialId: credential.id,
            historyId: notification.historyId,
        });

        const result = await inngest.send({
            name: "gmail/notification.received",
            data: {
                credentialId: credential.id,
                emailAddress: notification.emailAddress,
                historyId: notification.historyId,
            },
        });

        console.log("GMAIL EVENT SENT", result);

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Gmail webhook error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to process Gmail notification",
            },
            { status: 500 },
        );
    }
}