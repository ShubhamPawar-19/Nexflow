"use client";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@/generated/prisma/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { WHATSAPP_OUTPUT_VARIABLE } from "./constants";

const formSchema = z.object({
    variableName: z
        .string()
        .min(1, "Variable name is required")
        .regex(
            /^[A-Za-z_$][A-Za-z0-9_$]*$/,
            "Variable name must contain only letters, numbers, _ or $ and cannot start with a number",
        ),

    credentialId: z
        .string()
        .min(1, "WhatsApp credentials are required"),

    recipient: z
        .string()
        .min(1, "Recipient phone number is required"),

    message: z
        .string()
        .min(1, "Message is required"),
});

export type WhatsAppFormValues = z.infer<typeof formSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: WhatsAppFormValues) => void;
    defaultValues?: Partial<WhatsAppFormValues>;
}

export const WhatsAppDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues = {},
}: Props) => {
    const {
        data: credentials,
        isLoading: isLoadingCredentials,
    } = useCredentialsByType(CredentialType.WHATSAPP);

    const form = useForm<WhatsAppFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            variableName:
                defaultValues.variableName || WHATSAPP_OUTPUT_VARIABLE,
            credentialId: defaultValues.credentialId || "",
            recipient: defaultValues.recipient || "",
            message: defaultValues.message || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                variableName:
                    defaultValues.variableName || WHATSAPP_OUTPUT_VARIABLE,
                credentialId: defaultValues.credentialId || "",
                recipient: defaultValues.recipient || "",
                message: defaultValues.message || "",
            });
        }
    }, [open, defaultValues, form]);

    const watchVariableName =
        form.watch("variableName") || WHATSAPP_OUTPUT_VARIABLE;

    const handleSubmit = (values: WhatsAppFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0">
                <DialogHeader className="border-b px-6 pb-4 pt-6">
                    <DialogTitle>WhatsApp configuration</DialogTitle>

                    <DialogDescription>
                        Configure the WhatsApp message that this node will send.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-4">
                            {/* Variable Name */}
                            <FormField
                                control={form.control}
                                name="variableName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Variable Name</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="whatsapp"
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormDescription>
                                            Use this name to reference the
                                            WhatsApp result in other nodes:{" "}
                                            {`{{${watchVariableName}.messageId}}`}
                                        </FormDescription>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Credential */}
                            <FormField
                                control={form.control}
                                name="credentialId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            WhatsApp Credentials
                                        </FormLabel>

                                        <select
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={
                                                isLoadingCredentials ||
                                                !credentials?.length
                                            }
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="">
                                                {isLoadingCredentials
                                                    ? "Loading credentials..."
                                                    : credentials?.length
                                                      ? "Select credentials"
                                                      : "No WhatsApp credentials found"}
                                            </option>

                                            {credentials?.map((credential) => (
                                                <option
                                                    key={credential.id}
                                                    value={credential.id}
                                                >
                                                    {credential.name}
                                                </option>
                                            ))}
                                        </select>

                                        <FormDescription>
                                            The WhatsApp Cloud API credential
                                            used to send this message.
                                        </FormDescription>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Recipient */}
                            <FormField
                                control={form.control}
                                name="recipient"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Recipient</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="919876543210 or {{customer.phone}}"
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormDescription>
                                            Enter the recipient's WhatsApp
                                            number with country code. You can
                                            also use values from previous
                                            nodes.
                                        </FormDescription>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Message */}
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message</FormLabel>

                                        <FormControl>
                                            <Textarea
                                                placeholder={
                                                    "Hello {{customer.name}}, your order has been confirmed."
                                                }
                                                className="min-h-32 font-mono text-sm"
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormDescription>
                                            Use {"{{variables}}"} for simple
                                            values or {"{{json variable}}"} to
                                            stringify objects. You can also
                                            use the output of an AI node, for
                                            example {"{{gemini.text}}"}.
                                        </FormDescription>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-4">
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