'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from 'next/cache';
import { getProjectRoute } from '@/lib/routes';

/**
 * Create a new team in a project
 */
export async function createTeamAction(projectId: string, name: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { students: true }
        });

        if (!project) return { success: false, error: "Project not found" };

        // Check if user is teacher or student in project
        const isTeacher = project.teachers?.some(t => t.id === session.user.id) || session.user.role === 'ADMIN';
        const isStudent = project.students?.some(s => s.id === session.user.id);

        if (!isTeacher && !isStudent) return { success: false, error: "Unauthorized" };

        // Determine if user should be added to team immediately (if student creator)
        const membersConnect = isStudent ? { connect: [{ id: session.user.id }] } : undefined;

        await prisma.team.create({
            data: {
                name,
                projectId,
                members: membersConnect
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}/teams`);
        return { success: true };
    } catch (error) {
        console.error("Error creating team:", error);
        return { success: false, error: "Error creating team" };
    }
}

/**
 * Join an existing team
 */
export async function joinTeamAction(teamId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'STUDENT') return { success: false, error: "Unauthorized" };

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { project: { include: { students: true } }, members: true }
        });

        if (!team) return { success: false, error: "Team not found" };

        // Verify student is in the project
        const isEnrolled = team.project.students.some(s => s.id === session.user.id);
        if (!isEnrolled) return { success: false, error: "Must be enrolled in project to join team" };

        // Check if already in another team for this project?
        // Ideally yes, enforce 1 team per project
        const existingTeam = await prisma.team.findFirst({
            where: {
                projectId: team.projectId,
                members: { some: { id: session.user.id } }
            }
        });

        if (existingTeam) {
            if (existingTeam.id === teamId) return { success: true }; // Already in this team

            // Move student? Or error? Let's error for now, or move if flexible.
            // Let's remove from old team and add to new to allow switching.
            await prisma.team.update({
                where: { id: existingTeam.id },
                data: { members: { disconnect: { id: session.user.id } } }
            });
        }

        await prisma.team.update({
            where: { id: teamId },
            data: { members: { connect: { id: session.user.id } } }
        });

        revalidatePath(`/dashboard/professor/projects/${team.projectId}`);
        return { success: true };
    } catch (error) {
        console.error("Error joining team:", error);
        return { success: false, error: "Error joining team" };
    }
}

/**
 * Leave a team
 */
export async function leaveTeamAction(teamId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await prisma.team.update({
            where: { id: teamId },
            data: { members: { disconnect: { id: session.user.id } } }
        });

        // Optional: Delete team if empty?
        const updatedTeam = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
        if (updatedTeam && updatedTeam.members.length === 0) {
            await prisma.team.delete({ where: { id: teamId } });
        }

        revalidatePath(`/dashboard/professor/projects`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error leaving team" };
    }
}
