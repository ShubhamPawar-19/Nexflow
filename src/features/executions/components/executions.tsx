"use client";

import { EmptyView, EntityContainer, EntityHeader, EntityItem, EntityList, EntityPagination, EntitySearch, ErrorView, LoadingView } from "@/components/entity-components";
import { formatDistanceToNow } from "date-fns";
import { useExecutionsParams } from "../hooks/use-executions-params";
import { useSuspenseExecutions } from "../hooks/use-executions";
import { executionStatus, type Execution } from "@/generated/prisma/client";
import { CheckCircle2Icon, ClockIcon, Loader2Icon, XCircleIcon } from "lucide-react";

export const ExecutionsList = () => {
    const executions = useSuspenseExecutions();

    return (
        <EntityList
            items={executions.data.items}
            getkey={(execution) => execution.id}
            renderItems={(execution) => <ExecutionItem data={execution} />}
            emptyView={<ExecutionsEmpty />}
        />
    )
};

export const ExecutionsHeader = () => {

    return (
        <EntityHeader
            title="Executions"
            description="View your workflow execution history"
        />
    )
}

export const ExecutionsPagination = () => {
    const executions = useSuspenseExecutions();
    const [params, setParams] = useExecutionsParams();

    return (
        <EntityPagination
            disabled={executions.isFetching}
            totalPages={executions.data.totalCount}
            page={executions.data.page}
            onPageChange={(page) => setParams({ ...params, page })}
        />
    );
};


export const ExecutionsContainer = ({
    children
}: {
    children: React.ReactNode;
}) => {
    return (
        <EntityContainer
            header={<ExecutionsHeader />}
            pagination={<ExecutionsPagination />}
        >
            {children}
        </EntityContainer>
    );
};

export const ExecutionsLoading = () => {
    return <LoadingView message="Loading Executions..." />
};

export const ExecutionsError = () => {
    return <ErrorView message="Error Loading Executions..." />
};

export const ExecutionsEmpty = () => {

    return (
        <EmptyView
            message="You haven't started any executions yet. Get Started by running your first workflow"
        />
    );
};

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

const formStatus = (status: executionStatus) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
};

export const ExecutionItem = ({
    data,
}: {
    data: Execution & {
        workflow: {
            id: string;
            name: string;
        };
    };
}) => {
    const duration = data.completedAt
        ? Math.round(
            (new Date(data.completedAt).getTime() - new Date(data.startedAt).
                getTime()) / 1000,
        )
        : null;

    const subtitle = (
        <>
            {data.workflow.name} &bull; Started{" "}
            {formatDistanceToNow(data.startedAt, { addSuffix: true })}
            {duration !== null && <>&bull; Took {duration}s</>}
        </>
    )
    return (
        <EntityItem
            href={`/executions/${data.id}`}
            title={formStatus(data.status)}
            subtitle={subtitle}
            image={
                <div className="size-8 flex items-center justify-center">
                    {getStatusIcon(data.status)}
                </div>
            }
        />
    )
};