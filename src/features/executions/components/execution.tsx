"use client"
import { Button } from "@/components/ui/button";
import { executionStatus } from "@/generated/prisma/enums";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2Icon, ClockIcon, Loader2Icon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSuspenseExecution } from "../hooks/use-executions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const getStatusIcon = (status: executionStatus) => {
    switch (status) {
        case executionStatus.SUCCESS:
            return <CheckCircle2Icon className="size-5 text-green-600" />;
        case executionStatus.FAILED:
            return <XCircleIcon className="size-5 text-red-600" />;
        case executionStatus.RUNNING:
            return <Loader2Icon className="size-5 text-blue-600 animate-spin" />;
        default:
            return <ClockIcon className="size-5 text-muted-foreground" />
    };
};

const formatStatus = (status: executionStatus) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
};

export const ExecutionView = ({
    executionId
}: {
    executionId: string
}) => {
    const { data: execution } = useSuspenseExecution(executionId);
    const [showStackTrace, setShowStackTrace] = useState(false);

    const duration = execution.completedAt
        ? Math.round(
            (new Date(execution.completedAt).getTime() - new Date(execution.startedAt).
                getTime()) / 1000,
        )
        : null;

    return (
        <Card className="shadow-none">
            <CardHeader>
                <div className="flex items-center gap-3">
                    {getStatusIcon(execution.status)}
                </div>
                <div>
                    <CardTitle>
                        <CardDescription>
                            Execution for {execution.workflow.name}
                        </CardDescription>
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <p className="text-sm font-medium text-muted-foreground">
                        workflow
                    </p>
                    <Link
                        prefetch
                        className="text-sm hover:underline text-primary"
                        href={`/workflows/${execution.workflowId}`}>
                        {execution.workflow.name}
                    </Link>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <p className="text-sm">{formatStatus(execution.status)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Started</p>
                        <p className="text-sm">{formatDistanceToNow(execution.startedAt, { addSuffix: true })}</p>
                    </div>
                </div>

                {execution.completedAt ? (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Completed
                        </p>
                        <p className="text-sm">
                            {formatDistanceToNow(execution.completedAt, { addSuffix: true })}
                        </p>
                    </div>
                ) : null}

                {duration !== null ? (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Duration
                        </p>
                        <p className="text-sm">
                            {duration}s
                        </p>
                    </div>
                ) : null}

                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        EventId
                    </p>
                    <p className="text-sm">
                        {execution.inngestEventId}s
                    </p>
                </div>

                {execution.error && (
                    <div className="mt-6 p-4 bg-red-50 rounded-md space-y-3">
                        <p className="text-sm font-medium text-red-900 mb-2">
                            Error</p>
                        <p className="text-sm text-red-800 font-mono">
                            {execution.error}
                        </p>
                    </div>
                )}

                {execution.errorStack && (
                    <Collapsible
                        open={showStackTrace}
                        onOpenChange={setShowStackTrace}
                    >
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-900 hover:bg-red-100"
                            >
                                {showStackTrace
                                    ? "Hide stack trace"
                                    : "Show stack trace"}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <pre className="text-xs font mono text-red-800 overflow-auto mt-3 p-2 bg-red-100 rounded">
                                {execution.errorStack}
                            </pre>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {execution.output && (
                    <div className="mt-6 p-4 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-2">
                            <pre className="text-xs font-mono overflow-auto">
                                {JSON.stringify(execution.output, null, 2)}
                            </pre>
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
};