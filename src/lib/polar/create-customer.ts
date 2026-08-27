import { polarClient } from "@/lib/polar";

export async function createPolarCustomer(user: {
    id: string;
    email: string;
    name: string;
}) {
    const customer = await polarClient.customers.create({
        externalId: user.id,
        email: user.email,
        name: user.name,
    });

    return customer;
}