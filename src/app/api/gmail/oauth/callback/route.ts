import { NextResponse } from "next/server";
import { google } from "googleapis";

import prisma from "@/lib/db";
import {
    createGmailOAuthClient,
} from "@/lib/gmail";
import { encrypt } from "@/lib/encryption";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(
            new URL("/credentials?gmail=cancelled", request.url),
        );
    }

    if (!code || !state) {
        return NextResponse.json(
            { error: "Missing OAuth code or state" },
            { status: 400 },
        );
    }

    const oauthState = await prisma.gmailOAuthState.findUnique({
        where: { state },
    });

    if (!oauthState) {
        return NextResponse.json(
            { error: "Invalid OAuth state" },
            { status: 400 },
        );
    }

    if (oauthState.expiresAt < new Date()) {
        await prisma.gmailOAuthState.delete({
            where: { id: oauthState.id },
        });

        return NextResponse.json(
            { error: "OAuth state expired" },
            { status: 400 },
        );
    }

    const oauth2Client = createGmailOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);

if (!tokens.access_token) {
    return NextResponse.json(
        { error: "Google did not return an access token" },
        { status: 400 },
    );
}

oauth2Client.setCredentials(tokens);

const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
        headers: {
            Authorization: `Bearer ${tokens.access_token}`,
        },
    },
);

if (!userInfoResponse.ok) {
    return NextResponse.json(
        { error: "Unable to determine Google account" },
        { status: 400 },
    );
}

const userInfo = await userInfoResponse.json();

const emailAddress = userInfo.email;

if (!emailAddress) {
    return NextResponse.json(
        { error: "Google account email was not returned" },
        { status: 400 },
    );
}

    const credentialValue = JSON.stringify({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiryDate: tokens.expiry_date ?? null,
        scope: tokens.scope ?? null,
    });

    await prisma.credential.create({
        data: {
            name: `Gmail - ${emailAddress}`,
            type: "GMAIL",
            value: encrypt(credentialValue),
            accountEmail: emailAddress,
            userId: oauthState.userId,
        },
    });

    // OAuth state is single-use.
    await prisma.gmailOAuthState.delete({
        where: {
            id: oauthState.id,
        },
    });

    return NextResponse.redirect(
        new URL("/credentials?gmail=connected", request.url),
    );
}