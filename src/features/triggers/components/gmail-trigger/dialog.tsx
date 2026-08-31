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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

import { CredentialType } from "@/generated/prisma/enums";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";

export const gmailTriggerFormSchema = z.object({
    credentialId: z.string().min(1, "Gmail account is required"),

    // Used internally to match replies to a specific Gmail thread.
    // Optional for now because the UI doesn't ask the user for it.
    threadId: z.string().optional(),
});

export type GmailTriggerFormValues = z.infer<
    typeof gmailTriggerFormSchema
>;

interface GmailTriggerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: GmailTriggerFormValues) => void;
    defaultValues?: Partial<GmailTriggerFormValues>;
}

export const GmailTriggerDialog = ({
    open,
    onOpenChange,
    onSubmit,
    defaultValues,
}: GmailTriggerDialogProps) => {
    const { data: credentials = [], isLoading } =
        useCredentialsByType(CredentialType.GMAIL);

    const form = useForm<GmailTriggerFormValues>({
        resolver: zodResolver(gmailTriggerFormSchema),

        defaultValues: {
            credentialId: defaultValues?.credentialId || "",
            threadId: defaultValues?.threadId || "",
        },
    });

    useEffect(() => {
        if (!open) return;

        form.reset({
            credentialId: defaultValues?.credentialId || "",
            threadId: defaultValues?.threadId || "",
        });
    }, [open, defaultValues, form]);

    const handleSubmit = (values: GmailTriggerFormValues) => {
        onSubmit({
            credentialId: values.credentialId,
            threadId: values.threadId || undefined,
        });

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-137.5 p-4">
                <DialogHeader>
                    <DialogTitle>Gmail Trigger</DialogTitle>

                    <DialogDescription>
                        Choose the Gmail account that NexFlow should watch
                        for new emails.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                    >
                        <FormField
                            control={form.control}
                            name="credentialId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Gmail Account
                                    </FormLabel>

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
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};