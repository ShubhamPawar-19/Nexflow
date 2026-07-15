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
import { AVAILABLE_MODELS } from "./constants";

const formSchema = z.object({
    variableName: z.string()
        .min(1)
        .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/),

    credentialId: z.string().min(1),

    model: z.enum(AVAILABLE_MODELS),

    systemPrompt: z.string().optional(),

    userPrompt: z.string().min(1),
});

export type GeminiFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: z.infer<typeof formSchema>) => void;
    defaultValues?: Partial<GeminiFormValues>;
};

export const GeminiDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const {
        data: credentials,
        isLoading: isLoadingCredentials,
    } = useCredentialsByType(CredentialType.GEMINI);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            credentialId: defaultValues.credentialId || "",
            variableName: defaultValues.variableName || "",
            model: defaultValues.model || AVAILABLE_MODELS[0],
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
                model: defaultValues.model || AVAILABLE_MODELS[0],
                systemPrompt: defaultValues.systemPrompt || "",
                userPrompt: defaultValues.userPrompt || "",
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName = form.watch("variableName") || "myGemini";

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle>Gemini configuration</DialogTitle>
                        <DialogDescription>
                            Configure the AI model and prompts for this node.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className="flex min-h-0 flex-1 flex-col"
                        >
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
                                <FormField
                                    control={form.control}
                                    name="variableName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Variable Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="myGemini"
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
                                            <FormLabel>Gemini Credentials</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={
                                                    isLoadingCredentials || !credentials?.length
                                                }
                                            >
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
                                                                    src="/logos/gemini.svg"
                                                                    alt="Gemini"
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
                                    name="model"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Model</FormLabel>

                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a model" />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {AVAILABLE_MODELS.map((model) => (
                                                        <SelectItem
                                                            key={model}
                                                            value={model}
                                                        >
                                                            {model}
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
                                                    className="min-h-20 font-mono text-sm"
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
                                                    className="min-h-32 font-mono text-sm"
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
                            </div>
                            <DialogFooter className="sticky bottom border-t bg-background px-6 py-4">
                                <Button type="submit">Save</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
};