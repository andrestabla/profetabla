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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                create: items.map((item: any, index: number) => ({
                    title: item.title,
                    type: item.type,
                    url: item.url,
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
