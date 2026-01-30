'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// --- Helper for Auth ---
async function requireTeacherOrAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
        throw new Error('Unauthorized');
    }
    return session;
}

// --- Fetch Projects for Dropdown ---
export async function getProjectsForSelectAction() {
    await requireTeacherOrAdmin();
    
    const projects = await prisma.project.findMany({
        select: {
            id: true,
            title: true,
            type: true,
            status: true,
        },
        orderBy: { createdAt: 'desc' }
    });
    
    return projects;
}

// --- Update Resource ---
export async function updateResourceAction(id: string, data: {
    title?: string;
    description?: string;
    projectId?: string | null; // null to unassign
}) {
    await requireTeacherOrAdmin();

    await prisma.resource.update({
        where: { id },
        data: {
            title: data.title,
            description: data.description,
            projectId: data.projectId === 'GLOBAL' ? null : data.projectId
        }
    });

    revalidatePath('/dashboard/learning');
    return { success: true };
}

// --- Update Learning Object (OA) ---
export async function updateLearningObjectAction(id: string, data: {
    title?: string;
    description?: string;
    projectIds?: string[]; // List of project IDs to link
}) {
    await requireTeacherOrAdmin();

    // For OAs, it's a many-to-many relation with Project
    // We need to set the connections
    await prisma.learningObject.update({
        where: { id },
        data: {
            title: data.title,
            description: data.description,
            projects: {
                set: data.projectIds?.map(pid => ({ id: pid })) || []
            }
        }
    });

    revalidatePath('/dashboard/learning');
    return { success: true };
}
