import { prefetch, trpc } from "@/trpc/server";
import type { inferInput } from "@trpc/tanstack-react-query";

type Input = inferInput<typeof trpc.executions.getMany>;

/* prefetch all executions */

export const prefetchExecutions = (params:Input) => {
        return prefetch(trpc.executions.getMany.queryOptions(params));
};

/* Prefetch a single execution */

export const prefetchExecution = (id: string) => {
        return prefetch(trpc.executions.getOne.queryOptions({ id }));
};