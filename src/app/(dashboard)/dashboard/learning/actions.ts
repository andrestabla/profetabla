'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// --- Helper for Auth ---
async function requireTeacherOrAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'TEACHER')) {
        throw new Error('Unauthorized');
    }
    return session;
}

async function requireUser() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
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

// --- Update Learning Object Link/Metadata (For Edit Modal) ---
export async function updateLearningObjectAction(id: string, data: {
    title?: string;
    description?: string;
    projectIds?: string[]; // List of project IDs to link
}) {
    await requireTeacherOrAdmin();

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

// --- Create Learning Object (From New Page) ---
export async function createLearningObjectAction(formData: FormData) {
    const session = await requireTeacherOrAdmin();
    const userId = session.user.id;

    const title = formData.get('title') as string;
    const subject = formData.get('subject') as string;
    const competency = formData.get('competency') as string;
    const keywordsRaw = formData.get('keywords') as string;
    const description = formData.get('description') as string;
    const itemsJson = formData.get('itemsJson') as string;

    const keywords = keywordsRaw ? keywordsRaw.split(',').map(s => s.trim()) : [];
     
    const items = itemsJson ? JSON.parse(itemsJson) : [];

    await prisma.learningObject.create({
        data: {
            title,
            subject,
            competency,
            description,
            keywords,
            authorId: userId,
            items: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                create: items.map((item: any, idx: number) => ({
                    title: item.title,
                    type: item.type,
                    url: item.url,
                    order: idx,
                    metadata: {
                        presentation: item.presentation,
                        utility: item.utility
                    }
                }))
            }
        }
    });

    revalidatePath('/dashboard/learning');
    redirect('/dashboard/learning');
}

// --- Delete Learning Object ---
export async function deleteLearningObjectAction(id: string) {
    await requireTeacherOrAdmin();

    await prisma.learningObject.delete({
        where: { id }
    });

    revalidatePath('/dashboard/learning');
    redirect('/dashboard/learning');
}

// --- Add Comment to Learning Object ---
export async function addCommentToOAAction(learningObjectId: string, content: string) {
    const session = await requireUser();

    await prisma.comment.create({
        data: {
            content,
            authorId: session.user.id,
            learningObjectId: learningObjectId,
            // Resource relation optional, linking to OA here
        }
    });

    revalidatePath(`/dashboard/learning/object/${learningObjectId}`);
}
