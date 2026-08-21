"use client";

import { Button } from "@/components/ui/button";
import { useActivateWorkflow, useDeactivateWorkflow, useSuspenseWorkflow } from "@/features/workflows/hooks/use-workflows";


export const WorkflowActivationButton = ({
    workflowId,
}: {
    workflowId: string;
}) => {
    const { data: workflow } = useSuspenseWorkflow(workflowId);

    const activate = useActivateWorkflow();
    const deactivate = useDeactivateWorkflow();

    const isPending =
        activate.isPending || deactivate.isPending;

    const handleClick = () => {
        if (workflow.isActive) {
            deactivate.mutate({
                id: workflowId,
            });
        } else {
            activate.mutate({
                id: workflowId,
            });
        }
    };

    return (
        <Button
            onClick={handleClick}
            disabled={isPending}
            variant={workflow.isActive ? "destructive" : "default"}
        >
            {isPending
                ? "Updating..."
                : workflow.isActive
                    ? "Deactivate"
                    : "Activate"}
        </Button>
    );
};