import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";

import type { NodeExecutor } from "@/features/executions/types";
import { ifElseChannel } from "@/inngest/channels/if-else";

type IfElseOperator =
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "greater_than_or_equal"
    | "less_than_or_equal"
    | "is_empty"
    | "is_not_empty"
    | "starts_with"
    | "ends_with";

type IfElseCondition = {
    leftValue: string;
    operator: IfElseOperator;
    rightValue?: string;
};

type IfElseData = {
    conditions: IfElseCondition[];
    logicalOperator: "AND" | "OR";
};

const resolveValue = (
    value: string,
    context: Record<string, unknown>,
): string => {
    return Handlebars.compile(value, {
        noEscape: true,
    })(context);
};

const evaluateCondition = (
    condition: IfElseCondition,
    context: Record<string, unknown>,
): boolean => {
    const leftValue = resolveValue(
        condition.leftValue,
        context,
    );

    const rightValue = condition.rightValue
        ? resolveValue(condition.rightValue, context)
        : "";

    switch (condition.operator) {
        case "equals":
            return leftValue === rightValue;

        case "not_equals":
            return leftValue !== rightValue;

        case "contains":
            return leftValue.includes(rightValue);

        case "not_contains":
            return !leftValue.includes(rightValue);

        case "greater_than":
            return Number(leftValue) > Number(rightValue);

        case "less_than":
            return Number(leftValue) < Number(rightValue);

        case "greater_than_or_equal":
            return Number(leftValue) >= Number(rightValue);

        case "less_than_or_equal":
            return Number(leftValue) <= Number(rightValue);

        case "is_empty":
            return leftValue.trim() === "";

        case "is_not_empty":
            return leftValue.trim() !== "";

        case "starts_with":
            return leftValue.startsWith(rightValue);

        case "ends_with":
            return leftValue.endsWith(rightValue);

        default:
            throw new NonRetriableError(
                `If / Else node: unsupported operator ${condition.operator}`,
            );
    }
};

export const ifElseExecutor: NodeExecutor<IfElseData> =
    async ({
    data,
    nodeId,
    context,
    step,
    publish,
}) => {
    console.log("IF ELSE EXECUTOR STARTED:", {
        nodeId,
        context,
    });

    console.log("IF ELSE BEFORE LOADING PUBLISH:", {
        nodeId,
    });

    await publish(
        ifElseChannel().status({
            nodeId,
            status: "loading",
        }),
    );

    console.log("IF ELSE AFTER LOADING PUBLISH:", {
        nodeId,
    });

    try {
            const result = await step.run(
                `if-else-${nodeId}`,
                async () => {
                    console.log("IF ELSE STEP RUNNING:", {
                        nodeId,
                        context,
                        conditions: data.conditions,
                    });

                    if (
                        !data.conditions ||
                        data.conditions.length === 0
                    ) {
                        throw new NonRetriableError(
                            "If / Else node: no conditions configured",
                        );
                    }

                    const results = data.conditions.map(
                        (condition) =>
                            evaluateCondition(
                                condition,
                                context,
                            ),
                    );

                    const conditionResult =
                        data.logicalOperator === "OR"
                            ? results.some(Boolean)
                            : results.every(Boolean);

                    const result = {
                        ...context,

                        ifElse: {
                            result: conditionResult,
                            conditions: results,
                            logicalOperator:
                                data.logicalOperator,
                        },

                        __branch: conditionResult
                            ? "true"
                            : "false",
                    };

                    console.log("IF ELSE STEP RESULT:", {
                        nodeId,
                        branch: result.__branch,
                        result,
                    });

                    return result;
                },
            );

            console.log("IF ELSE EXECUTOR RETURNING:", {
                nodeId,
                branch: result.__branch,
            });

            await publish(
                ifElseChannel().status({
                    nodeId,
                    status: "success",
                }),
            );

            return result;
        } catch (error) {
            await publish(
                ifElseChannel().status({
                    nodeId,
                    status: "error",
                }),
            );

            throw error;
        }
    };
