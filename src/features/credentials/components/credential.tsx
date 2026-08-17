"use client";

import { CredentialType } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import {
    useCreateCredential,
    useSuspenseCredential,
    useUpdateCredential,
} from "../hooks/use-credentials";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface CredentialFormProps {
    initialData?: {
        id?: string;
        name: string;
        type: CredentialType;
        value: string;
    };
}

const formSchema = z
    .object({
        name: z.string().min(1, "Name is required"),
        type: z.enum(CredentialType),

        // Used by OpenAI, Gemini, Anthropic
        value: z.string().optional(),

        // Used only by WhatsApp
        accessToken: z.string().optional(),
        phoneNumberId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.type === CredentialType.WHATSAPP) {
            if (!data.accessToken?.trim()) {
                ctx.addIssue({
                    code: "custom",
                    path: ["accessToken"],
                    message: "Access token is required",
                });
            }

            if (!data.phoneNumberId?.trim()) {
                ctx.addIssue({
                    code: "custom",
                    path: ["phoneNumberId"],
                    message: "Phone Number ID is required",
                });
            }
        } else if (data.type !== CredentialType.GMAIL && !data.value?.trim()) {
            ctx.addIssue({
                code: "custom",
                path: ["value"],
                message: "API key is required",
            });
        }
    });

type FormValues = z.infer<typeof formSchema>;

const credentialTypeOptions = [
    {
        value: CredentialType.OPENAI,
        label: "OpenAI",
        logo: "/logos/openai.svg",
    },
    {
        value: CredentialType.ANTHROPIC,
        label: "Anthropic",
        logo: "/logos/anthropic.svg",
    },
    {
        value: CredentialType.GEMINI,
        label: "Gemini",
        logo: "/logos/gemini.svg",
    },
    {
        value: CredentialType.WHATSAPP,
        label: "WhatsApp",
        logo: "/logos/whatsapp.svg",
    },
    {
        value: CredentialType.GMAIL,
        label: "Gmail",
        logo: "/logos/gmail.svg",
    },
];

export const CredentialForm = ({
    initialData,
}: CredentialFormProps) => {
    const router = useRouter();

    const createCredential = useCreateCredential();
    const updateCredential = useUpdateCredential();

    const { handleError, modal } = useUpgradeModal();

    const isEdit = !!initialData?.id;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || "",
            type: initialData?.type || CredentialType.OPENAI,
            value: initialData?.type !== CredentialType.WHATSAPP
                ? initialData?.value || ""
                : "",
            accessToken: "",
            phoneNumberId: "",
        },
    });

    const selectedType = form.watch("type");
    const isWhatsApp = selectedType === CredentialType.WHATSAPP;
    const isGmail = selectedType === CredentialType.GMAIL;

    /*
     * When editing a WhatsApp credential, the backend intentionally
     * returns value as an empty string for security.
     *
     * We therefore don't try to decode/reveal the existing secret.
     * The user must enter the credentials again when updating it.
     */
    useEffect(() => {
        if (!initialData) return;

        form.reset({
            name: initialData.name,
            type: initialData.type,
            value:
                initialData.type !== CredentialType.WHATSAPP
                    ? initialData.value || ""
                    : "",
            accessToken: "",
            phoneNumberId: "",
        });
    }, [initialData, form]);

    const onSubmit = async (values: FormValues) => {
        /*
         * IMPORTANT:
         *
         * Our database has only:
         *
         * Credential.value: String
         *
         * Therefore WhatsApp credentials are serialized into
         * one JSON string and then encrypted by the server.
         */
        let credentialValue = values.value || "";

        if (values.type === CredentialType.WHATSAPP) {
            credentialValue = JSON.stringify({
                accessToken: values.accessToken,
                phoneNumberId: values.phoneNumberId,
            });
        }

        const payload = {
            name: values.name,
            type: values.type,
            value: credentialValue,
        };

        if (isEdit && initialData?.id) {
            await updateCredential.mutateAsync({
                id: initialData.id,
                ...payload,
            });
        } else {
            await createCredential.mutateAsync(payload, {
                onSuccess: (data) => {
                    router.push(`/credentials`);
                },
                onError: (error) => {
                    handleError(error);
                },
            });
        }
    };

    return (
        <>
            {modal}

            <Card className="shadow-none">
                <CardHeader>
                    <CardTitle>
                        {isEdit
                            ? "Edit Credential"
                            : "Create Credential"}
                    </CardTitle>

                    <CardDescription>
                        {isEdit
                            ? "Update your API key or credential details"
                            : "Add a new API key or credential to your account"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6"
                        >
                            {/* Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>

                                        <FormControl>
                                            <Input
                                                placeholder={
                                                    isWhatsApp
                                                        ? "My WhatsApp Business"
                                                        : "My API key"
                                                }
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Type */}
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>

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
                                                {credentialTypeOptions.map(
                                                    (option) => (
                                                        <SelectItem
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Image
                                                                    src={option.logo}
                                                                    alt={option.label}
                                                                    width={16}
                                                                    height={16}
                                                                />

                                                                {option.label}
                                                            </div>
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Standard AI credentials */}
                            {!isWhatsApp && !isGmail && (
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                API Key
                                            </FormLabel>

                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="sk-..."
                                                    {...field}
                                                />
                                            </FormControl>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* WhatsApp credentials */}
                            {isWhatsApp && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="accessToken"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    WhatsApp Access Token
                                                </FormLabel>

                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter your WhatsApp access token"
                                                        autoComplete="new-password"
                                                        {...field}
                                                    />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="phoneNumberId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Phone Number ID
                                                </FormLabel>

                                                <FormControl>
                                                    <Input
                                                        placeholder="123456789012345"
                                                        {...field}
                                                    />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <p className="text-sm text-muted-foreground">
                                        Your WhatsApp access token will be
                                        encrypted before it is stored.
                                    </p>
                                </>
                            )}

                            {/* Gmail credentials */}

                            {isGmail && (
                                <div className="space-y-3">
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm font-medium">
                                            Connect your Gmail account
                                        </p>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Connect a Gmail account that NexFlow can use to send emails.
                                        </p>

                                        <Button
                                            type="button"
                                            className="mt-4"
                                            onClick={() => {
                                                window.location.href = "/api/gmail/oauth";
                                            }}
                                        >
                                            Connect Gmail
                                        </Button>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        NexFlow only requests permission to send emails. Your Gmail
                                        password is never shared with NexFlow.
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                {!isGmail && (
                                    <Button
                                        type="submit"
                                        disabled={
                                            createCredential.isPending ||
                                            updateCredential.isPending
                                        }
                                    >
                                        {isEdit ? "Update" : "Create"}
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                >
                                    <Link
                                        href="/credentials"
                                        prefetch
                                    >
                                        Cancel
                                    </Link>
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </>
    );
};

export const CredentialView = ({
    credentialId,
}: {
    credentialId: string;
}) => {
    const { data: credential } =
        useSuspenseCredential(credentialId);

    return (
        <CredentialForm initialData={credential} />
    );
};