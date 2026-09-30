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

export type IfElseNodeData = {
    conditions?: IfElseCondition[];
    logicalOperator?: "AND" | "OR";
};