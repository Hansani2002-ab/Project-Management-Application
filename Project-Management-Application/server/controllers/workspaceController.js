import prisma from "../configs/prisma.js";
import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const getUserWorkspaces = async (req, res) => {
    try {
        const { userId } = req.auth;

        const clerkMemberships = await clerkClient.users.getOrganizationMembershipList({ userId });

        for (const membership of clerkMemberships.data) {
            const org = membership.organization;

            let workspace = await prisma.workspace.findUnique({
                where: { id: org.id }
            });

            if (!workspace) {
                await prisma.workspace.create({
                    data: {
                        id: org.id,
                        name: org.name,
                        slug: org.slug,
                        ownerId: userId,
                        members: {
                            create: {
                                userId: userId,
                                role: "ADMIN"
                            }
                        }
                    }
                });
            }
        }

        const workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId: userId } }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { 
                            include: { 
                                assignee: true, 
                                comments: { include: { user: true } } 
                            } 
                        },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });

        res.json({ workspaces });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

export const addMember = async (req, res) => {
    try {
        const { userId } = req.auth;
        const { email, role, workspaceId, message } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!workspaceId || !role) {
            return res.status(400).json({ message: "Missing required parameters" });
        }

        if (!["ADMIN", "MEMBER"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const isAdmin = workspace.members.find(
            (member) => member.userId === userId && member.role === "ADMIN"
        );

        if (!isAdmin) {
            return res.status(401).json({ message: "You don't have admin privileges" });
        }

        const isAlreadyMember = workspace.members.find(
            (member) => member.userId === user.id
        );

        if (isAlreadyMember) {
            return res.status(400).json({ message: "User is already a member" });
        }

        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId,
                role,
                message
            }
        });

        res.json({ member, message: "Member added successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};