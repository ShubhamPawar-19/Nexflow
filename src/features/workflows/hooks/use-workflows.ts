// hook to fetch all workflows using suspense

import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkflowParams } from "./use-workflows-params";

export const useSuspenseWorkflows = () => {
    const trpc = useTRPC();
    const [params] = useWorkflowParams();

    return useSuspenseQuery(trpc.workflows.getMany.queryOptions(params));
};

// hook to create new workflow

export const useCreateWorkflow = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.create.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow "${data.name}" created`);
            queryClient.invalidateQueries(
                trpc.workflows.getMany.queryOptions({}),
            );
        },
        onError: (error) => {
            toast.error(`Failed to create workflow: "${error.message}"`);
        },
    }),
);
};


/** Hook to remove Workflow **/

export const useRemoveWorkflow = () => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    return useMutation(
        trpc.workflows.remove.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow "${data.name}" removed`);
                queryClient.invalidateQueries(trpc.workflows.getMany.queryOptions({}));
                queryClient.invalidateQueries(
                    trpc.workflows.getOne.queryFilter({ id: data.id }),
                );
            }
        })
    )
}

/*  Hook to fetch a single workflow using suspense  */

export const useSuspenseWorkflow = (id: string) => {
    const trpc = useTRPC();
    return useSuspenseQuery(trpc.workflows.getOne.queryOptions({
        id
    }));
};

// hook to update a workflow name

export const useUpdateWorkflowName = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.updateName.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow ${data.name} Updated`);
            queryClient.invalidateQueries(
                trpc.workflows.getMany.queryOptions({}),
            );
            queryClient.invalidateQueries(
                trpc.workflows.getOne.queryOptions({ id: data.id}),
            );
        },
        onError: (error) => {
            toast.error(`Failed to Update workflow: ${error.message}`);
        },
    }),
);
};

// hook to update a workflow  

export const useUpdateWorkflow = () => {
    const queryClient = useQueryClient();
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.update.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow ${data.name} Saved`);
            queryClient.invalidateQueries(
                trpc.workflows.getMany.queryOptions({}),
            );
            queryClient.invalidateQueries(
                trpc.workflows.getOne.queryOptions({ id: data.id}),
            );
        },
        onError: (error) => {
            toast.error(`Failed to save workflow: ${error.message}`);
        },
    }),
);
};

// hook to execute a workflow  

export const useExecuteWorkflow = () => {
    const trpc = useTRPC();

    return useMutation(
        trpc.workflows.execute.mutationOptions({
        onSuccess: (data) => {
            toast.success(`Workflow ${data.name} executed`);
        },
        onError: (error) => {
            toast.error(`Failed to execute workflow: ${error.message}`);
        },
    }),
);
};

// Hook to activate a workflow

export const useActivateWorkflow = () => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    return useMutation(
        trpc.workflows.activate.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow "${data.name}" activated`);

                queryClient.invalidateQueries(
                    trpc.workflows.getOne.queryOptions({
                        id: data.id,
                    }),
                );

                queryClient.invalidateQueries(
                    trpc.workflows.getMany.queryOptions({}),
                );
            },
            onError: (error) => {
                toast.error(
                    `Failed to activate workflow: ${error.message}`,
                );
            },
        }),
    );
};


// Hook to deactivate a workflow

export const useDeactivateWorkflow = () => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    return useMutation(
        trpc.workflows.deactivate.mutationOptions({
            onSuccess: (data) => {
                toast.success(`Workflow "${data.name}" deactivated`);

                queryClient.invalidateQueries(
                    trpc.workflows.getOne.queryOptions({
                        id: data.id,
                    }),
                );

                queryClient.invalidateQueries(
                    trpc.workflows.getMany.queryOptions({}),
                );
            },
            onError: (error) => {
                toast.error(
                    `Failed to deactivate workflow: ${error.message}`,
                );
            },
        }),
    );
};