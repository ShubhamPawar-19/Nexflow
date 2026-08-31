import prisma from "@/lib/db";
import { sendWorkflowExecution } from "@/inngest/utils";
import { NodeType } from "@/generated/prisma/enums";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params: Promise<{
        webhookId: string;
    }>;
}

export async function POST(
    request: NextRequest,
    { params }: RouteParams,
) {
    try {
        const { webhookId } = await params;

        if (!webhookId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing webhook ID",
                },
                { status: 400 },
            );
        }

        // Find the webhook trigger node
        const webhookNode = await prisma.node.findFirst({
            where: {
                id: webhookId,
                type: NodeType.WEBHOOK_TRIGGER,
            },
            include: {
                workflow: true,
            },
        });

        if (!webhookNode) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Webhook not found",
                },
                { status: 404 },
            );
        }

        // Make sure the workflow is active
        if (!webhookNode.workflow.isActive) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Workflow is not active",
                },
                { status: 400 },
            );
        }

        // Read request body
        let body: unknown = {};

        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            body = await request.json();
        } else {
            const text = await request.text();

            try {
                body = JSON.parse(text);
            } catch {
                body = text;
            }
        }

        // Read query parameters
        const query: Record<string, string> = {};

        request.nextUrl.searchParams.forEach((value, key) => {
            query[key] = value;
        });

        // Read request headers
        const headers: Record<string, string> = {};

        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        // Send workflow execution to Inngest
        await sendWorkflowExecution({
            workflowId: webhookNode.workflowId,
            initialData: {
                webhook: {
                    body,
                    headers,
                    query,
                    method: request.method,
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Webhook received successfully",
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Webhook error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to process webhook",
            },
            { status: 500 },
        );
    }


}
