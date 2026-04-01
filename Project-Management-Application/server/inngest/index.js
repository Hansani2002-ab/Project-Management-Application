import prisma from '../configs/prisma.js';
import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });

// Inngest function to save user data to a database
export const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { data } = event;
        
        // Email එක නැති වුණොත් Prisma error එකක් එන එක වැළැක්වීමට fallback එකක් ලබා දීම
        const userEmail = data.email_addresses?.[0]?.email_address || "no-email-provided@test.com";
        const fullName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "Unknown User";

        // Use upsert to prevent errors if user already exists
        await prisma.user.upsert({
            where: { id: data.id },
            update: {
                email: userEmail,
                name: fullName,
                image: data.image_url,
            },
            create: {
                id: data.id,
                email: userEmail,
                name: fullName,
                image: data.image_url,
            }
        });
    }
);

// Inngest function to delete user from database
export const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-from-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { data } = event;
        
        await prisma.user.delete({
            where: { id: data.id }
        });
    }
);

// Inngest function to update user data in database
export const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { data } = event;

        const userEmail = data.email_addresses?.[0]?.email_address || "no-email-provided@test.com";
        const fullName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "Unknown User";

        await prisma.user.update({
            where: { id: data.id },
            data: {
                email: userEmail,
                name: fullName,
                image: data.image_url,
            }
        });
    }
);

// Exporting Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation
];