import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { polarClient } from "@/lib/polar";

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const customer = await polarClient.customers.create({
            externalId: session.user.id,
            email: session.user.email,
            name: session.user.name,
        });

        return NextResponse.json({
            success: true,
            customer,
        });
    } catch (error) {
        console.error("Failed to create Polar customer:", error);

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create Polar customer",
            },
            { status: 500 }
        );
    }
}