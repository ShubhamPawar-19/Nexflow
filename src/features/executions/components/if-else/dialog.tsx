"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const operatorValues = [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "greater_than",
    "less_than",
    "greater_than_or_equal",
    "less_than_or_equal",
    "is_empty",
    "is_not_empty",
    "starts_with",
    "ends_with",
] as const;

const conditionSchema = z.object({
    leftValue: z.string().min(1, {
        message: "Value is required",
    }),
    operator: z.enum(operatorValues),
    rightValue: z.string().optional(),
});

const formSchema = z.object({
    conditions: z.array(conditionSchema).min(1),
    logicalOperator: z.enum(["AND", "OR"]),
});

export type IfElseFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: IfElseFormValues) => void;
    defaultValues?: Partial<IfElseFormValues>;
}

export const IfElseDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const form = useForm<IfElseFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            conditions: defaultValues.conditions?.length
                ? defaultValues.conditions
                : [
                    {
                        leftValue: "",
                        operator: "equals",
                        rightValue: "",
                    },
                ],
            logicalOperator:
                defaultValues.logicalOperator || "AND",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                conditions: defaultValues.conditions?.length
                    ? defaultValues.conditions
                    : [
                        {
                            leftValue: "",
                            operator: "equals",
                            rightValue: "",
                        },
                    ],
                logicalOperator:
                    defaultValues.logicalOperator || "AND",
            });
        }
    }, [open, defaultValues, form]);

    const conditions = form.watch("conditions");

    const handleSubmit = (values: IfElseFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>If / Else</DialogTitle>

                    <DialogDescription>
                        Evaluate one or more conditions and continue
                        through the TRUE or FALSE branch.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6 mt-4"
                    >
                        {conditions.map((_, index) => {
                            const operator =
                                form.watch(
                                    `conditions.${index}.operator`,
                                );

                            const requiresRightValue = ![
                                "is_empty",
                                "is_not_empty",
                            ].includes(operator);

                            return (
                                <div
                                    key={index}
                                    className="space-y-4 rounded-md border p-4"
                                >
                                    <div className="text-sm font-medium">
                                        Condition {index + 1}
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name={`conditions.${index}.leftValue`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Value
                                                </FormLabel>

                                                <FormControl>
                                                    <Input
                                                        placeholder="{{gmail.subject}}"
                                                        {...field}
                                                    />
                                                </FormControl>

                                                <FormDescription>
                                                    Static value or
                                                    workflow variable.
                                                </FormDescription>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={`conditions.${index}.operator`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Operator
                                                </FormLabel>

                                                <Select
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select operator" />
                                                        </SelectTrigger>
                                                    </FormControl>

                                                    <SelectContent>
                                                        <SelectItem value="equals">
                                                            Equals
                                                        </SelectItem>

                                                        <SelectItem value="not_equals">
                                                            Does not equal
                                                        </SelectItem>

                                                        <SelectItem value="contains">
                                                            Contains
                                                        </SelectItem>

                                                        <SelectItem value="not_contains">
                                                            Does not contain
                                                        </SelectItem>

                                                        <SelectItem value="starts_with">
                                                            Starts with
                                                        </SelectItem>

                                                        <SelectItem value="ends_with">
                                                            Ends with
                                                        </SelectItem>

                                                        <SelectItem value="greater_than">
                                                            Greater than
                                                        </SelectItem>

                                                        <SelectItem value="less_than">
                                                            Less than
                                                        </SelectItem>

                                                        <SelectItem value="greater_than_or_equal">
                                                            Greater than or equal
                                                        </SelectItem>

                                                        <SelectItem value="less_than_or_equal">
                                                            Less than or equal
                                                        </SelectItem>

                                                        <SelectItem value="is_empty">
                                                            Is empty
                                                        </SelectItem>

                                                        <SelectItem value="is_not_empty">
                                                            Is not empty
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {requiresRightValue && (
                                        <FormField
                                            control={form.control}
                                            name={`conditions.${index}.rightValue`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Compare With
                                                    </FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            placeholder="approved"
                                                            {...field}
                                                        />
                                                    </FormControl>

                                                    <FormDescription>
                                                        Static value or
                                                        workflow variable.
                                                    </FormDescription>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            );
                        })}

                        <FormField
                            control={form.control}
                            name="logicalOperator"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Match Conditions
                                    </FormLabel>

                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>

                                        <SelectContent>
                                            <SelectItem value="AND">
                                                All conditions must match
                                                (AND)
                                            </SelectItem>

                                            <SelectItem value="OR">
                                                Any condition can match
                                                (OR)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="rounded-md border bg-muted/50 p-3 text-sm">
                            <div className="font-medium mb-1">
                                Example
                            </div>

                            <div className="text-muted-foreground">
                                {"{{gmail.subject}}"} contains{" "}
                                {"invoice"}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit">
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};