import { NextResponse } from "next/server";
import crypto from "crypto";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getGmailAuthorizationUrl } from "@/lib/gmail";

export async function GET(request: Request) {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    if (!session?.user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
        );
    }

    const state = crypto.randomBytes(32).toString("hex");

    // Store the state temporarily so the callback can verify
    // that the OAuth request belongs to this logged-in user.
    await prisma.gmailOAuthState.create({
        data: {
            state,
            userId: session.user.id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
    });

    const authorizationUrl = getGmailAuthorizationUrl(state);

    return NextResponse.redirect(authorizationUrl);
}