"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { CredentialType } from "@/generated/prisma/enums";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";

export const gmailFormSchema = z.object({
    credentialId: z.string().min(1, "Gmail account is required"),
    to: z.string().min(1, "Recipient is required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Email body is required"),
});

export type GmailFormValues = z.infer<typeof gmailFormSchema>;

interface GmailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: GmailFormValues) => void;
    defaultValues?: Partial<GmailFormValues>;
}

export const GmailTriggerDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues,
}: GmailDialogProps) => {
    const { data: credentials = [], isLoading } =
        useCredentialsByType(CredentialType.GMAIL);

    const form = useForm<GmailFormValues>({
        resolver: zodResolver(gmailFormSchema),
        defaultValues: {
            credentialId: defaultValues?.credentialId || "",
            to: defaultValues?.to || "",
            subject: defaultValues?.subject || "",
            body: defaultValues?.body || "",
        },
    });

    useEffect(() => {
        if (!open) return;

        form.reset({
            credentialId: defaultValues?.credentialId || "",
            to: defaultValues?.to || "",
            subject: defaultValues?.subject || "",
            body: defaultValues?.body || "",
        });
    }, [open, defaultValues, form]);

    const handleSubmit = (values: GmailFormValues) => {
        onSubmit(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="
                    w-[calc(100%-2rem)]
                    max-w-137.5
                    max-h-[90vh]
                    overflow-hidden
                    p-0
                "
            >
                {/* Header */}
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle>Gmail Configuration</DialogTitle>

                    <DialogDescription>
                        Configure the Gmail account and email you want to send.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="flex max-h-[calc(90vh-120px)] flex-col"
                    >
                        {/* Form Content */}
                        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                            {/* Gmail Account */}
                            <FormField
                                control={form.control}
                                name="credentialId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gmail Account</FormLabel>

                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={isLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue
                                                        placeholder={
                                                            isLoading
                                                                ? "Loading accounts..."
                                                                : "Select Gmail account"
                                                        }
                                                    />
                                                </SelectTrigger>
                                            </FormControl>

                                            <SelectContent>
                                                {credentials.map(
                                                    (credential) => (
                                                        <SelectItem
                                                            key={credential.id}
                                                            value={credential.id}
                                                        >
                                                            {credential.accountEmail ||
                                                                credential.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Recipient */}
                            <FormField
                                control={form.control}
                                name="to"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>To</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="customer@example.com"
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Subject */}
                            <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Subject</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder="Welcome to NexFlow"
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Body */}
                            <FormField
                                control={form.control}
                                name="body"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Message</FormLabel>

                                        <FormControl>
                                            <Textarea
                                                placeholder="Hello, welcome to NexFlow!"
                                                className="min-h-37.5 w-full resize-none whitespace-pre-wrap wrap-break-word"
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Footer */}
                        <div className="border-t bg-background px-6 py-4">
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>

                                <Button type="submit">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};