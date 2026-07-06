import { InitialNode } from "@/components/initial-node";
import { HttpRequestNode } from "@/features/executions/components/http-request/node";
import { googleFormTrigger } from "@/features/triggers/components/google-form-trigger/node";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node";
import { NodeType } from "@/generated/prisma/enums";
import type { NodeTypes } from "@xyflow/react";

export const nodeComponents = {
    [NodeType.INITIAL] : InitialNode,
    [NodeType.HTTP_REQUEST] : HttpRequestNode,
    [NodeType.MANUAL_TRIGGER] : ManualTriggerNode,
    [NodeType.GOOGLE_FORM_TRIGGER] : googleFormTrigger,
} as const satisfies NodeTypes;

export type RegistrationNodeType = keyof typeof nodeComponents;