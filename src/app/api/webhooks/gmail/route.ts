import prisma from "@/lib/db";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

type GmailPubSubNotification = {
    emailAddress: string;
    historyId: string;
};

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();

        if (!rawBody.trim()) {
            console.log("Gmail webhook received empty request body");

            return NextResponse.json({
                success: true,
            });
        }

        let body: any;

        try {
            body = JSON.parse(rawBody);
        } catch (error) {
            console.error("Invalid Gmail webhook JSON:", error);

            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid JSON",
                },
                { status: 400 },
            );
        }

        const encodedData = body?.message?.data;

        if (!encodedData) {
            console.error(
                "Missing Pub/Sub message data",
                body,
            );

            return NextResponse.json(
                {
                    success: false,
                    error: "Missing message data",
                },
                { status: 400 },
            );
        }

        let notification: GmailPubSubNotification;

        try {
            const decodedData = Buffer.from(
                encodedData,
                "base64",
            ).toString("utf-8");

            notification = JSON.parse(decodedData);
        } catch (error) {
            console.error(
                "Failed to decode Gmail notification:",
                error,
            );

            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid notification data",
                },
                { status: 400 },
            );
        }

        if (
            !notification.emailAddress ||
            !notification.historyId
        ) {
            console.error(
                "Invalid Gmail notification:",
                notification,
            );

            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid Gmail notification",
                },
                { status: 400 },
            );
        }

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

            // Return 200 so Pub/Sub doesn't keep retrying
            // a notification for an account that no longer exists.
            return NextResponse.json({
                success: true,
            });
        }

        console.log("GMAIL EVENT SEND", {
            credentialId: credential.id,
            emailAddress: notification.emailAddress,
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