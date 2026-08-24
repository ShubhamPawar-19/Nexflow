import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";

import { executeWorkflow } from "@/inngest/function";
import { processGmailNotification } from "@/inngest/functions/process-gmail-notification";

export const { GET, POST, PUT } = serve({
    client: inngest,

    functions: [
        executeWorkflow,
        processGmailNotification,
    ],
});