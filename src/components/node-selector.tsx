"use client";

import { NodeType } from "@/generated/prisma/enums";
import { createId } from "@paralleldrive/cuid2";
import { GlobeIcon, MousePointerIcon } from "lucide-react";
import React, { useCallback } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "./ui/sheet";
import { Separator } from "./ui/separator";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";

export type NodeTypeOption = {
    type: NodeType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }> | string;
};

const triggerNode: NodeTypeOption[] = [
    {
        type: NodeType.MANUAL_TRIGGER,
        label: "Trigger manually",
        description: "Runs the flow on clicking button. Good for getting started quickly",
        icon: MousePointerIcon,
    },
    {
        type: NodeType.GOOGLE_FORM_TRIGGER,
        label: "Google Form",
        description: "Runs the flow when a Google Form is submitted",
        icon: "/logos/googleform.svg",
    },
    {
        type: NodeType.STRIPE_TRIGGER,
        label: "Stripe",
        description: "Runs the flow when a Stripe Event is Captured",
        icon: "/logos/stripe.svg",
    },
    {
        type: NodeType.WHATSAPP_TRIGGER,
        label: "WhatsApp",
        description: "Runs the flow when a WhatsApp message is received",
        icon: "/logos/whatsapp.svg",
    },
    {
        type: NodeType.GMAIL_TRIGGER,
        label: "Gmail",
        description: "When a new email arrives",
        icon: "/logos/gmail.svg",
    }
];

const executionNode: NodeTypeOption[] = [
    {
        type: NodeType.HTTP_REQUEST,
        label: "HTTP Request",
        description: "Makes an HTTP Request",
        icon: GlobeIcon,
    },
    {
        type: NodeType.GEMINI,
        label: "Gemini",
        description: "Use Google Gemini to generate text",
        icon: "/logos/gemini.svg",
    },
    {
        type: NodeType.OPENAI,
        label: "OpenAi",
        description: "Use OpenAi to generate text",
        icon: "/logos/openai.svg",
    },
    {
        type: NodeType.ANTHROPIC,
        label: "Anthropic",
        description: "Use Anthropic to generate text",
        icon: "/logos/anthropic.svg",
    },
    {
        type: NodeType.DISCORD,
        label: "Discord",
        description: "Send a message to Discord",
        icon: "/logos/discord.svg",
    },
    {
        type: NodeType.SLACK,
        label: "Slack",
        description: "Send a message to Slack",
        icon: "/logos/slack.svg",
    },
    {
        type: NodeType.WHATSAPP,
        label: "WhatsApp",
        description: "Send a WhatsApp message",
        icon: "/logos/whatsapp.svg",
    },
    {
        type: NodeType.GMAIL,
        label: "Gmail",
        description: "Send an email using Gmail",
        icon: "/logos/gmail.svg",
    },
];

interface NodeSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
};

export function NodeSelector({
    open,
    onOpenChange,
    children
}: NodeSelectorProps) {

    const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();

    const handleNodeSelect = useCallback((selection: NodeTypeOption) => {
        //check if trying to add a manual trigger when ne already exists
        if (selection.type === NodeType.MANUAL_TRIGGER) {
            const nodes = getNodes();
            const hasManualTrigger = nodes.some(
                (node) => node.type === NodeType.MANUAL_TRIGGER,
            );

            if (hasManualTrigger) {
                toast.error("Only one manual trigger is allowed per workflow");
                return;
            }
        }

        setNodes((nodes) => {
            const hasInitialTrigger = nodes.some(
                (node) => node.type === NodeType.INITIAL,
            );

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            const flowPosition = screenToFlowPosition({
                x: centerX + (Math.random() - 0.5) * 200,
                y: centerY + (Math.random() - 0.5) * 200,
            });

            const newNode = {
                id: createId(),
                data: {},
                position: flowPosition,
                type: selection.type,
            };

            if (hasInitialTrigger) {
                return [newNode];
            }

            return [...nodes, newNode];
        });

        onOpenChange(false);
    }, [
        setNodes,
        getNodes,
        onOpenChange,
        screenToFlowPosition,
    ]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md 
            overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        What trigger this workflow?
                    </SheetTitle>
                    <SheetDescription>
                        A Trigger is a step that start your workflow
                    </SheetDescription>
                </SheetHeader>
                <div>
                    {triggerNode.map((nodeType) => {
                        const Icon = nodeType.icon;

                        return (
                            <div
                                key={nodeType.type}
                                className="w-full justify-start h-auto py-5 
                            px-4 rounded-none cursor-pointer border-l-2
                             border-transparent"
                                onClick={() => handleNodeSelect(nodeType)}
                            >
                                <div className="flex items-center 
                                gap-6 w-full overflow-hidden">
                                    {typeof Icon === "string" ? (
                                        <img
                                            src={Icon}
                                            alt={nodeType.label}
                                            className="size-5 object-contain
                                         rounded-sm"
                                        />
                                    ) : (
                                        <Icon className="size-5" />
                                    )}
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-medium text-sm">
                                            {nodeType.label}

                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {nodeType.description}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <Separator />
                <div>
                    {executionNode.map((nodeType) => {
                        const Icon = nodeType.icon;

                        return (
                            <div
                                key={nodeType.type}
                                className="w-full justify-start h-auto py-5 
                            px-4 rounded-none cursor-pointer border-l-2
                             border-transparent"
                                onClick={() => handleNodeSelect(nodeType)}
                            >
                                <div className="flex items-center 
                                gap-6 w-full overflow-hidden">
                                    {typeof Icon === "string" ? (
                                        <img
                                            src={Icon}
                                            alt={nodeType.label}
                                            className="size-5 object-contain
                                         rounded-sm"
                                        />
                                    ) : (
                                        <Icon className="size-5" />
                                    )}
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-medium text-sm">
                                            {nodeType.label}

                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {nodeType.description}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </SheetContent>
        </Sheet>
    )
};