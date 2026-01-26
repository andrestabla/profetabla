'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function linkOAToProjectAction(projectId: string, oaId: string, link: boolean) {
    try {
        if (link) {
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    learningObjects: {
                        connect: { id: oaId }
                    }
                }
            });
        } else {
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    learningObjects: {
                        disconnect: { id: oaId }
                    }
                }
            });
        }
        revalidatePath(`/dashboard/professor/projects/${projectId}/learning`);
        return { success: true };
    } catch (error) {
        console.error("Error linking OA:", error);
        return { success: false, error: "Error al actualizar la vinculación" };
    }
}
