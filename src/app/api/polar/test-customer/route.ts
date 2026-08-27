// app/api/polar/test-customer/route.ts

import { auth } from "@/lib/auth";
import { polarClient } from "@/lib/polar";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return Response.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        console.log("Checking Polar customer:", userId);

        const customer = await polarClient.customers.getExternal({
            externalId: userId,
        });

        return Response.json({
            success: true,
            userId,
            customer,
        });
    } catch (error) {
        console.error("Polar customer lookup failed:", error);

        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            { status: 500 }
        );
    }
}