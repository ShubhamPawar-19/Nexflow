"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const WhatsAppTriggerDialog = ({
    open,
    onOpenChange,
}: Props) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        WhatsApp Trigger Configuration
                    </DialogTitle>

                    <DialogDescription>
                        This trigger starts the workflow whenever a new
                        WhatsApp message is received.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm">
                            How it works
                        </h4>

                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>
                                Connect your WhatsApp Business account to
                                NexFlow.
                            </li>

                            <li>
                                Configure the WhatsApp webhook in Meta
                                Developer Dashboard.
                            </li>

                            <li>
                                Send a message to your WhatsApp number.
                            </li>

                            <li>
                                NexFlow automatically starts this workflow.
                            </li>
                        </ol>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-medium text-sm">
                            Available Variables
                        </h4>

                        <ul className="text-sm text-muted-foreground space-y-2">
                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{whatsapp.message}}"}
                                </code>
                                {" - Incoming message text"}
                            </li>

                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{whatsapp.from}}"}
                                </code>
                                {" - Sender's WhatsApp number"}
                            </li>

                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{whatsapp.messageId}}"}
                                </code>
                                {" - WhatsApp message ID"}
                            </li>

                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{whatsapp.phoneNumberId}}"}
                                </code>
                                {" - Receiving WhatsApp phone number ID"}
                            </li>

                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{whatsapp.timestamp}}"}
                                </code>
                                {" - Message timestamp"}
                            </li>

                            <li>
                                <code className="bg-background px-1 py-0.5 rounded">
                                    {"{{json whatsapp}}"}
                                </code>
                                {" - Full WhatsApp trigger data as JSON"}
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                                Tip:
                            </span>{" "}
                            Connect this trigger to a Gemini, OpenAI, or
                            WhatsApp node to automatically process and reply
                            to incoming messages.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};