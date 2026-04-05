import { WorkspaceRole } from '@prisma/client';
import prisma from '../configs/prisma.js';
import { Inngest } from "inngest";
import sendEmail from '../configs/nodemailer.js';


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

export const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-from-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.delete({ where: { id: data.id } });
    }
);

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
                image_url: data.image_url,
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
                image_url: data.image_url,
            }
        });
    }
);

const syncWorkspaceDeletion = inngest.createFunction(
    { id: 'delete-workspace-from-clerk' }, 
    { event: 'clerk/organization.deleted' }, 
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.delete({
            where: { id: data.id }
        });
    }
);

const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: 'add-member-to-workspace-from-clerk' }, 
    { event: 'clerk/organizationInvitation.accepted' },
    async ({ event }) => {
        const { data } = event;
        
        await prisma.workspaceMember.create({
            data: {
                userId: data.user_id,
                workspaceId: data.organization_id,
                
                role: data.role === 'org:admin' ? 'ADMIN' : 'MEMBER',
            }
        });
    }
);

// Inngest function to send email on task creation
const sendTaskAssignmentEmail = inngest.createFunction(
    {id: "send-task-assignment-mail"},
    {event: "app/task.assigned"},
    async ({event, step}) => {
        const {taskId, origin} = event.data;

        const task = await prisma.task.findUnique({
            where: {id: taskId},
            include: {assignee: true, project: true}
        })
        await sendEmail({
            to: task.assignee.email,
            subject:`New Task Assignment in ${task.project.name}`,
            body: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Project Management</h1>
        </div>
        
        <div style="padding: 24px; color: #1e293b;">
            <h2 style="font-size: 20px; margin-bottom: 16px;">Hi ${task.assignee.name},</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #475569;">
                This is a friendly reminder regarding a task assigned to you in the <strong>${task.project.name}</strong> project.
            </p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; font-weight: bold; color: #1e293b;">Task: ${task.title}</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">
                    Due Date: ${new Date(task.due_date).toLocaleDateString()}
                </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5; color: #475569;">
                Please ensure that you check the project dashboard for more details and updates.
            </p>
            
            <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.CLIENT_URL}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    View Task Details
                </a>
            </div>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} Project Management System. All rights reserved.
        </div>
    </div>`
            
        })

        if(new Date (task.due_date).toLocaleDateString() !== new Date().toLocaleString()){
            await step.sleepUntil('wait-for-the-due-date', new Date(task.due_date));

            await step.run('check-if-task-is-completed', async () => {
                const task = await prisma.task.findUnique({
                    where: {id: taskId},
                    include: {assignee: true, project: true}
                })

                if (!task) return;

                if(task.status !== "DONE"){
                    await step.run('send-task-reminder-mail', async () => {
                        await sendEmail({
                            to: task.assignee.email,
                            subject: `Reminder for ${task.project.name}`,
                            body: `<div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 10px auto; border: 1px solid #fee2e2; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
        
        <div style="background-color: #ef4444; padding: 25px; text-align: center;">
            <span style="font-size: 40px;">⚠️</span>
            <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 20px; font-weight: 700;">Task Reminder</h1>
        </div>

        <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #1f2937; margin-top: 0;">Hi <strong>${task.assignee.name}</strong>,</p>
            <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">
                This is a friendly reminder that your task <strong>"${task.title}"</strong> is still pending in the <strong>${task.project.name}</strong> project.
            </p>

            <div style="background-color: #fff1f2; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px dashed #fda4af;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding-bottom: 10px; color: #9f1239; font-size: 13px; font-weight: 600; text-transform: uppercase;">Current Status</td>
                        <td style="padding-bottom: 10px; color: #9f1239; font-size: 13px; font-weight: 600; text-transform: uppercase; text-align: right;">Due Date</td>
                    </tr>
                    <tr>
                        <td style="color: #111827; font-size: 16px; font-weight: 600;">⏳ ${task.status.replace('_', ' ')}</td>
                        <td style="color: #ef4444; font-size: 16px; font-weight: 600; text-align: right;">📅 ${new Date(task.due_date).toLocaleDateString()}</td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 14px; color: #6b7280; font-style: italic;">
                "Completing your tasks on time helps the whole team stay on track!"
            </p>

            <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL}/projects/${task.projectId}" style="background-color: #111827; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block;">
                    Update Task Status
                </a>
            </div>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                You received this because a task assigned to you is not marked as 'DONE'.
            </p>
        </div>
    </div>`
                        })
                    })
                }
            })
        }
    }
)

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation,
    sendTaskAssignmentEmail
];