"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@/generated/prisma/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export const AVAILABEL_MODELS = [
    "claude-2.0",
    "claude-3-7-sonnet",
    "claude-3-5-sonnet",
    "claude-instant-1.2",

] as const;

const formSchema = z.object({
    variableName: z.string()
        .min(1, { message: "Variable name is required" })
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
            message: "Variable name must start with a letter or underscore and contains only letter,numbers, and undescores ",
        }),
            credentialId: z.string().min(1, "Credential is required"),
            systemPrompt: z.string().optional(),
            userPrompt: z.string().min(1, "User Prompt is Required"),
});

export type AnthropicFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<AnthropicFormValues>;
};

export const AnthropicDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const {
        data: credentials,
        isLoading: isLoadingCredentials,
    } = useCredentialsByType(CredentialType.ANTHROPIC);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            credentialId: defaultValues.credentialId || "",
            variableName: defaultValues.variableName || "",
            systemPrompt: defaultValues.systemPrompt || "",
            userPrompt: defaultValues.userPrompt || "",
        },
    });

    // Reset form values when dialog opens with new defaluts
    useEffect(() => {
        if (open) {
            form.reset({
                credentialId: defaultValues.credentialId || "",
                variableName: defaultValues.variableName || "",
                systemPrompt: defaultValues.systemPrompt || "",
                userPrompt: defaultValues.userPrompt || "",
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "myAnthropic";

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Anthropic configuration</DialogTitle>
                    <DialogDescription>
                        Configure the AI model and prompts for this node.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-8 mt-4"
                    >
                        <FormField
                            control={form.control}
                            name="variableName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Variable Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="myAnthropic"
                                            {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        use this name to reference the result in other nodes: {""}
                                        {`{{${watchVariableName}.text}}`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="credentialId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Anthropic Credentials</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}>
                                        disabled={
                                            isLoadingCredentials
                                            || !credentials?.length
                                        }
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a placeholder" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {credentials?.map((option) => (
                                                <SelectItem
                                                    key={option.id}
                                                    value={option.id}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Image
                                                            src="/logos/anthropic.svg"
                                                            alt="Anthropic"
                                                            width={16}
                                                            height={16}
                                                        />
                                                        {option.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="systemPrompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>System Prompt (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="You are helful assitant."
                                            className="min-h-[80px font-mono text-sm"
                                            {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Sets the behavior of the assistant. Use {"{{variables}}"}
                                        for simple values or {"{{json variable}}"} to stringify Objects
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="userPrompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>User Prompt</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Summerize the text {{json httpResponse.data}}."
                                            className="min-h-[120px font-mono text-sm"
                                            {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        The Prompt to send to the AI. Use {"{{variables}}"}
                                        for simple values or {"{{json variable}}"} tp stringify the objects
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-4">
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}