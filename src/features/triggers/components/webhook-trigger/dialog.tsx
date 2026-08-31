"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nodeId: string;
}

export const WebhookTriggerDialog = ({
    open,
    onOpenChange,
    nodeId,
}: Props) => {
    const params = useParams();

    const workflowId = params.workflowId as string;

    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const webhookUrl = `${baseUrl}/api/webhooks/${nodeId}`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(webhookUrl);
            toast.success("Webhook URL copied to clipboard");
        } catch {
            toast.error("Failed to copy webhook URL");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-4">
                <DialogHeader>
                    <DialogTitle>
                        Webhook Trigger Configuration
                    </DialogTitle>

                    <DialogDescription>
                        Send an HTTP request to this URL to trigger your
                        workflow.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="webhook-url">
                            Webhook URL
                        </Label>

                        <div className="flex gap-2">
                            <Input
                                id="webhook-url"
                                value={webhookUrl}
                                readOnly
                                className="font-mono text-sm"
                            />

                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={copyToClipboard}
                            >
                                <CopyIcon className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm">
                            How to use
                        </h4>

                        <p className="text-sm text-muted-foreground">
                            Send a POST request to the webhook URL above.
                            The request body will be available to the
                            following nodes in your workflow.
                        </p>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm">
                            Example request
                        </h4>

                        <pre className="text-xs bg-background p-3 rounded-md overflow-x-auto">
                            {`POST ${webhookUrl}
                             {"name": "Shubham","email": "[shubham@example.com](mailto:shubham@example.com)"}`}
                        </pre>
                    </div>


                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm">
                            Available Variables
                        </h4>

                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{webhook.body.name}}"}
                                </code>
                                {" "}— Access a value from the request body
                            </li>

                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{webhook.body.email}}"}
                                </code>
                                {" "}— Access another body value
                            </li>

                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{json.webhook.body}}"}
                                </code>
                                {" "}— Access the complete request body
                            </li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );


};
