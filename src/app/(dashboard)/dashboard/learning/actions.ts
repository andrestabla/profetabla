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
    presentation?: string;
    utility?: string;
    subject?: string;
    competency?: string;
    keywords?: string;
    projectId?: string | null; // null to unassign
    url?: string;
    type?: string;
}) {
    await requireTeacherOrAdmin();

    await prisma.resource.update({
        where: { id },
        data: {
            title: data.title,
            description: data.description,
            presentation: data.presentation,
            utility: data.utility,
            subject: data.subject,
            competency: data.competency,
            keywords: data.keywords ? data.keywords.split(',').map(s => s.trim()) : undefined,
            projectId: data.projectId === 'GLOBAL' ? null : data.projectId,
            url: data.url,
            type: data.type
        }
    });

    revalidatePath('/dashboard/learning');
    return { success: true };
}

// --- Update Learning Object Metadata (For Edit Modal) ---
export async function updateLearningObjectMetadataAction(id: string, data: {
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

// --- Update Learning Object Full Content (For Edit Page) ---
export async function updateLearningObjectAction(formData: FormData) {
    await requireTeacherOrAdmin();
    const id = formData.get('id') as string;

    if (!id) throw new Error("Missing ID");

    const title = formData.get('title') as string;
    const subject = formData.get('subject') as string;
    const competency = formData.get('competency') as string;
    const keywordsRaw = formData.get('keywords') as string;
    const description = formData.get('description') as string;
    const presentation = formData.get('presentation') as string;
    const utility = formData.get('utility') as string;
    const itemsJson = formData.get('itemsJson') as string;

    const keywords = keywordsRaw ? keywordsRaw.split(',').map(s => s.trim()) : [];

    const items = itemsJson ? JSON.parse(itemsJson) : [];

    // Transaction to update OA and replace items
    await prisma.$transaction(async (tx) => {
        // 1. Update OA basic info
        await tx.learningObject.update({
            where: { id },
            data: {
                title,
                subject,
                competency,
                description,
                presentation,
                utility,
                keywords,
            }
        });

        // 2. Delete existing items (simple replace strategy for now)
        // Alternatively we could try to diff them, but full replace is safer for order handling
        await tx.resource.deleteMany({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            where: { learningObjectId: id } as any
        });

        // 3. Create new items
        if (items.length > 0) {
            // We need to map items to createMany or create. 
            // Since resource table structure might be complex, let's look at schema inference.
            // Items are Resources linked to the OA.
            // Wait, schema says LearningObject->items is separate or same resource?
            // Assuming LearningObject has relation `items` which are Resources.
            // Let's assume standard structure based on `createLearningObjectAction`.

            /* 
               Structure in createLearningObjectAction:
                items: {
                   create: items.map(...)
               }
            */

            // Note: `deleteMany` works on the relation if it's One-to-Many.


            for (const [idx, item] of items.entries()) {
                await tx.resource.create({
                    data: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        title: (item as any).title,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        type: (item as any).type,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        url: (item as any).url,
                        order: idx,
                        learningObjectId: id,
                        metadata: {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            presentation: (item as any).presentation,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            utility: (item as any).utility,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            subject: (item as any).subject,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            competency: (item as any).competency,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            keywords: (item as any).keywords || []
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any
                });
            }
        }
    });

    revalidatePath('/dashboard/learning');
    revalidatePath(`/dashboard/learning/object/${id}`);
    redirect(`/dashboard/learning/object/${id}`);
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
    const presentation = formData.get('presentation') as string;
    const utility = formData.get('utility') as string;
    const itemsJson = formData.get('itemsJson') as string;

    const keywords = keywordsRaw ? keywordsRaw.split(',').map(s => s.trim()) : [];

    const items = itemsJson ? JSON.parse(itemsJson) : [];

    try {
        await prisma.learningObject.create({
            data: {
                title,
                subject,
                competency,
                description,
                presentation,
                utility,
                keywords,
                authorId: userId,
                items: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    create: items.map((item: any, idx: number) => ({
                        title: item.title,
                        type: item.type,
                        url: item.url,
                        order: idx,
                        presentation: item.presentation,
                        utility: item.utility,
                        subject: item.subject,
                        competency: item.competency,
                        keywords: item.keywords || []
                    }))
                }
            }
        });

        revalidatePath('/dashboard/learning');
    } catch (e: unknown) {
        console.error("Error creating OA:", e);
        const error = e as Error;
        return { success: false, error: error.message || 'Error al crear el objeto de aprendizaje' };
    }

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

// --- Create Single Global/Project Resource ---
export async function createGlobalResourceAction(formData: FormData) {
    await requireTeacherOrAdmin();
    const projectId = formData.get('projectId') as string;
    const driveTitle = formData.get('driveTitle') as string;
    const title = driveTitle || (formData.get('title') as string);
    const type = formData.get('type') as string;
    const url = formData.get('url') as string;
    const presentation = formData.get('presentation') as string;
    const utility = formData.get('utility') as string;
    const subject = formData.get('subject') as string;
    const competency = formData.get('competency') as string;
    const keywordsRaw = formData.get('keywords') as string;
    const file = formData.get('file') as File;

    const keywords = keywordsRaw ? keywordsRaw.split(',').map(s => s.trim()) : [];

    if (!title) {
        return { success: false, error: 'El título es obligatorio' };
    }

    try {
        let finalUrl = url;
        let finalTitle = title;

        // Handle Drive Upload if file is present
        if (type === 'DRIVE' && file && file.size > 0) {
            // Determine target folder: Project's folder OR Global Config folder
            let targetFolderId = '';

            if (projectId && projectId !== 'GLOBAL') {
                const project = await prisma.project.findUnique({ where: { id: projectId } });
                targetFolderId = project?.googleDriveFolderId || '';
            }

            if (!targetFolderId) {
                const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
                targetFolderId = config?.googleDriveFolderId || '';
            }

            if (!targetFolderId) {
                return { success: false, error: 'No se ha configurado una carpeta de Drive (ni en el proyecto ni global).' };
            }

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const { uploadFileToDrive } = await import('@/lib/google-drive'); // Dynamic import
            // Readable stream for upload
            const { Readable } = await import('stream');
            const stream = Readable.from(buffer);

            const uploaded = await uploadFileToDrive(targetFolderId, file.name, file.type, stream);
            if (!uploaded || !uploaded.webViewLink) {
                return { success: false, error: 'Falló la subida a Drive' };
            }
            finalUrl = uploaded.webViewLink;
            finalTitle = file.name;
        } else if (!finalUrl) {
            return { success: false, error: 'La URL es obligatoria si no subes un archivo' };
        }

        // Get or Create Category
        const category = await prisma.resourceCategory.findFirst();
        const categoryId = category?.id || (await prisma.resourceCategory.create({ data: { name: 'General' } })).id;

        await prisma.resource.create({
            data: {
                title: finalTitle,
                type,
                url: finalUrl,
                presentation,
                utility,
                subject,
                competency,
                keywords,
                categoryId,
                projectId: (projectId && projectId !== 'GLOBAL') ? projectId : null
            }
        });

        revalidatePath('/dashboard/learning');
        if (projectId && projectId !== 'GLOBAL') {
            revalidatePath(`/dashboard/professor/projects/${projectId}`);
        }

    } catch (e: unknown) {
        console.error("Error creating global resource:", e);
        const error = e as Error;
        return { success: false, error: error.message || 'Error al crear el recurso' };
    }

    redirect('/dashboard/learning');
}

// --- Delete Resource ---
export async function deleteResourceAction(id: string) {
    await requireTeacherOrAdmin();

    try {
        const resource = await prisma.resource.findUnique({
            where: { id },
            select: { projectId: true }
        });

        if (!resource) {
            return { success: false, error: "Recurso no encontrado" };
        }

        await prisma.resource.delete({
            where: { id }
        });

        revalidatePath('/dashboard/learning');
        if (resource.projectId) {
            revalidatePath(`/dashboard/professor/projects/${resource.projectId}`);
        }

        return { success: true };
    } catch (e: unknown) {
        console.error("Error deleting resource:", e);
        const error = e as Error;
        return { success: false, error: error.message || "Error al eliminar el recurso" };
    }
}
