import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { geminiChannel } from "@/inngest/channels/gemini";
import { createGoogleGenerativeAI } from "@ai-sdk/google";


Handlebars.registerHelper("json", (context) => {
    const jsonString = JSON.stringify(context, null, 2);
    const safeString = new Handlebars.SafeString(jsonString);

    return safeString;
});

type GeminiData = {
    variableName?: string;
    model?: string;
    systemPrompt?: string;
    userPrompt?: string;
};

export const geminiExecutor: NodeExecutor<GeminiData> =
    async ({
        data,
        nodeId,
        context,
        step,
        publish,
    }) => {
        await publish(
            geminiChannel().status({
                nodeId,
                status: "loading",
            }),
        );

        if (!data.variableName) {
            await publish(
                geminiChannel().status({
                    nodeId,
                    status: "error",
                })
            );
            throw new NonRetriableError("Gemini node: Variable name is missing");
        }

        if (!data.userPrompt) {
            await publish(
                geminiChannel().status({
                    nodeId,
                    status: "error",
                })
            );
            throw new NonRetriableError("Gemini node: User Prompt is missing");
        }

        //todo: throw if when credentials is missing

        const systemPrompt = data.systemPrompt
            ? Handlebars.compile(data.systemPrompt)(context)
            : "You are a helful assistant.";
        const userPrompt = Handlebars.compile(data.userPrompt)(context);

        //TODO: Fetch credentials that user selected

        const credentialValue = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

        const google = createGoogleGenerativeAI({
            apiKey: credentialValue,
        });

        try {
            const { steps } = await step.ai.wrap(
                "gemini-generate-text",
                generateText,
                {
                    model: google(data.model || "gemini-2.5-flash"),
                    system: systemPrompt,
                    prompt: userPrompt,
                    experimental_telemetry: {
                        isEnabled: true,
                        recordInputs: true,
                        recordOutputs: true,
                    },
                },
            );

            const text =
                steps[0].content[0].type === "text"
                    ? steps[0].content[0].text
                    : "";

            await publish(
                geminiChannel().status({
                    nodeId,
                    status: "success",
                }),
            );

            return {
                ...context,
                [data.variableName]: {
                    text,
                },
            }
        } catch (error) {
            await publish(
                geminiChannel().status({
                    nodeId,
                    status: "error",
                }),
            );
            throw error;
        }
    };
