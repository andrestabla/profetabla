'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from 'next/cache';

export async function updateAssignmentWeightsAction(weights: { id: string, weight: number }[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await prisma.$transaction(
            weights.map(w =>
                prisma.assignment.update({
                    where: { id: w.id },
                    data: { weight: w.weight }
                })
            )
        );

        revalidatePath('/dashboard/grades');
        return { success: true };
    } catch (error: unknown) {
        console.error('Error updating weights:', error);
        const message = error instanceof Error ? error.message : 'Error al actualizar pesos';
        return { success: false, error: message };
    }
}
