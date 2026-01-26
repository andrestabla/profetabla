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

    // Create the OA
    await prisma.learningObject.create({
        data: {
            title,
            description,
            subject,
            authorId: session.user.id,
            // Add default items for the example as requested
            items: {
                create: [
                    {
                        title: 'Introducción al Tema (Ejemplo)',
                        type: 'PDF',
                        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Dummy PDF
                        order: 0
                    }
                ]
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
