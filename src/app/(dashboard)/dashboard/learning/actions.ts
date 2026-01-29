'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createLearningObjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        throw new Error('Unauthorized');
    }

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const subject = formData.get('subject') as string;
    const competency = formData.get('competency') as string;
    const keywordsRaw = formData.get('keywords') as string;

    // Parse Items JSON
    const itemsJson = formData.get('itemsJson') as string;
     
    const items = itemsJson ? JSON.parse(itemsJson) : [];

    // Process Keywords (comma separated)
    const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(k => k.length > 0) : [];

    // Create the OA and Items in a Transaction
    await prisma.learningObject.create({
        data: {
            title,
            description,
            subject,
            competency,
            keywords,
            authorId: session.user.id,
            items: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                create: items.map((item: any, index: number) => ({
                    title: item.title,
                    type: item.type,
                    url: item.url,
                    presentation: item.presentation,
                    utility: item.utility,
                    order: index // Maintain order from the frontend list
                }))
            }
        }
    });

    revalidatePath('/dashboard/learning');
    redirect(`/dashboard/learning`);
}

export async function markItemAsCompletedAction(itemId: string, timeSpent: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'STUDENT') return;

    // Actualiza o crea (upsert) el registro de progreso del estudiante
    await prisma.itemInteraction.upsert({
        where: {
            userId_resourceItemId: {
                userId: session.user.id,
                resourceItemId: itemId,
            }
        },
        update: {
            isCompleted: true,
            lastAccessed: new Date(),
            // Suma el tiempo invertido en esta sesión al tiempo acumulado
            timeSpentSecs: { increment: timeSpent }
        },
        create: {
            userId: session.user.id,
            resourceItemId: itemId,
            isCompleted: true,
            timeSpentSecs: timeSpent
        }
    });

    // Revalidar para que el check aparezca en la UI
    revalidatePath('/dashboard/learning/object/[id]', 'page');
}

export async function updateLearningObjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        throw new Error('Unauthorized');
    }

    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const subject = formData.get('subject') as string;
    const competency = formData.get('competency') as string;
    const keywordsRaw = formData.get('keywords') as string;
    const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(k => k.length > 0) : [];

    // Check ownership
    const oa = await prisma.learningObject.findUnique({ where: { id } });
    if (!oa) throw new Error('Not found');
    if (session.user.role !== 'ADMIN' && oa.authorId !== session.user.id) throw new Error('Unauthorized');

    // For items, simplistic approach: Delete all and recreate (easiest for MVP editing)
    // A better approach would be to diff, but that's complex without ID tracking in frontend
    const itemsJson = formData.get('itemsJson') as string;
     
    const items = itemsJson ? JSON.parse(itemsJson) : [];

    await prisma.$transaction(async (tx) => {
        await tx.learningObject.update({
            where: { id },
            data: {
                title,
                description,
                subject,
                competency,
                keywords
            }
        });

        // Delete existing items
        await tx.resourceItem.deleteMany({ where: { learningObjectId: id } });

        // Recreate items
        if (items.length > 0) {
            await tx.resourceItem.createMany({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data: items.map((item: any, index: number) => ({
                    title: item.title,
                    type: item.type,
                    url: item.url,
                    presentation: item.presentation,
                    utility: item.utility,
                    order: index,
                    learningObjectId: id
                }))
            });
        }
    });

    revalidatePath(`/dashboard/learning/object/${id}`);
    revalidatePath('/dashboard/learning');
    redirect(`/dashboard/learning/object/${id}`);
}

export async function addCommentToOAAction(oaId: string, content: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('Unauthorized');

    if (!content.trim()) return;

    await prisma.comment.create({
        data: {
            content,
            learningObjectId: oaId,
            authorId: session.user.id
        }
    });

    revalidatePath(`/dashboard/learning/object/${oaId}`);
}

export async function deleteLearningObjectAction(id: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        throw new Error('Unauthorized');
    }

    const oa = await prisma.learningObject.findUnique({ where: { id } });
    if (!oa) throw new Error('Not found');

    if (session.user.role !== 'ADMIN' && oa.authorId !== session.user.id) {
        throw new Error('Unauthorized');
    }

    await prisma.learningObject.delete({
        where: { id }
    });

    revalidatePath('/dashboard/learning');
    redirect('/dashboard/learning');
}
