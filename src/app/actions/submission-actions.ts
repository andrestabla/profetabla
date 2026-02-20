'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Updates the grade and feedback for a specific submission.
 */
export async function updateManualGradeAction(submissionId: string, grade: number, feedback?: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await prisma.submission.update({
            where: { id: submissionId },
            data: {
                grade,
                feedback: feedback || undefined,
            }
        });

        revalidatePath('/dashboard/grades');
        revalidatePath('/dashboard/professor/projects/[id]', 'layout');
        return { success: true };
    } catch (e: unknown) {
        console.error("Error updating manual grade:", e);
        return { success: false, error: 'Error al actualizar la calificación' };
    }
}

/**
 * Deletes a submission and resets the associated task status if applicable.
 * This effectively allows a student to re-submit or re-take a quiz.
 */
export async function deleteSubmissionAction(submissionId: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const submission = await tx.submission.findUnique({
                where: { id: submissionId },
                include: { assignment: { include: { task: true } } }
            });

            if (!submission) throw new Error("Entrega no encontrada");

            // Delete the submission (rubric scores should cascade if properly configured, 
            // but we'll be safer if needed. RubricScore has onDelete: Cascade in schema)
            await tx.submission.delete({
                where: { id: submissionId }
            });

            // Reset associated task status to TODO if it exists
            if (submission.assignment?.task?.id) {
                await tx.task.update({
                    where: { id: submission.assignment.task.id },
                    data: { status: 'TODO' }
                });
            }
        });

        revalidatePath('/dashboard/grades');
        revalidatePath('/dashboard/kanban');
        revalidatePath('/dashboard/professor/projects/[id]');
        revalidatePath('/dashboard/student');
        revalidatePath('/dashboard/assignments');
        return { success: true };
    } catch (e: unknown) {
        console.error("Error deleting submission:", e);
        const errorMessage = e instanceof Error ? e.message : 'Error al eliminar la entrega';
        return { success: false, error: errorMessage };
    }
}
