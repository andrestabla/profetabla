'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
