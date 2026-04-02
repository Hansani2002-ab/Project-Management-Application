import { WorkspaceRole } from '@prisma/client';
import prisma from '../configs/prisma.js';
import { Inngest } from "inngest";


export const inngest = new Inngest({ id: "project-management" });

export const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { data } = event;
        const userEmail = data.email_addresses?.[0]?.email_address || "no-email@test.com";
        const fullName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "Unknown User";

        await prisma.user.upsert({
            where: { id: data.id },
            update: { email: userEmail, name: fullName, image: data.image_url },
            create: { id: data.id, email: userEmail, name: fullName, image: data.image_url }
        });
    }
);

/**
 * 2. User Deletion Sync
 */
export const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-from-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.delete({ where: { id: data.id } });
    }
);

/**
 * 3. User Update Sync
 */
export const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { data } = event;
        const userEmail = data.email_addresses?.[0]?.email_address || "no-email@test.com";
        const fullName = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "Unknown User";

        await prisma.user.update({
            where: { id: data.id },
            data: { email: userEmail, name: fullName, image: data.image_url }
        });
    }
);


const syncWorkspaceCreation = inngest.createFunction(
    { id: 'create-workspace-from-clerk' }, 
    { event: 'clerk/organization.created' },
    async ({ event }) => {
        const { data } = event;
        
        
        await prisma.workspace.create({
            data: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                ownerId: data.created_by,
                imageUrl: data.image_url,
            }
        });


        await prisma.workspaceMember.create({
            data: {
                userId: data.created_by,
                workspaceId: data.id,
                role: "ADMIN"
            }
        });
    }
);

/**
 * 5. Workspace Update Sync
 */
const syncWorkspaceUpdation = inngest.createFunction(
    { id: 'update-workspace-from-clerk' },
    { event: 'clerk/organization.updated' },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.update({
            where: { id: data.id },
            data: {
                name: data.name,
                slug: data.slug,
                imageUrl: data.image_url,
            }
        });
    }
);

/**
 * 6. Workspace Deletion Sync
 */
const syncWorkspaceDeletion = inngest.createFunction(
    { id: 'delete-workspace-from-clerk' }, 
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.delete({
            where: { id: data.id }
        });
    }
);

/**
 * 7. Workspace Member Sync (Invitation Accepted)
 */
const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: 'add-member-to-workspace-from-clerk' }, 
    { event: 'clerk/organizationInvitation.accepted' },
    async ({ event }) => {
        const { data } = event;
        
        await prisma.workspaceMember.create({
            data: {
                userId: data.user_id,
                workspaceId: data.organization_id,
                
                role: String(data.role_name).toUpperCase(),
            }
        });
    }
);


export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation
];