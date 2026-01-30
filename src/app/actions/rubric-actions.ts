'use server';

// @ts-nocheck
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function saveRubricAction(assignmentId: string, items: { criterion: string; maxPoints: number; order: number; id?: string }[]) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Delete items not in the list (if updating)
            const itemIds = items.filter(i => i.id).map(i => i.id);
            await tx.rubricItem.deleteMany({
                where: {
                    assignmentId,
                    id: { notIn: itemIds as string[] }
                }
            });

            // 2. Upsert items
            for (const item of items) {
                if (item.id) {
                    await tx.rubricItem.update({
                        where: { id: item.id },
                        data: {
                            criterion: item.criterion,
                            maxPoints: item.maxPoints,
                            order: item.order
                        }
                    });
                } else {
                    await tx.rubricItem.create({
                        data: {
                            assignmentId,
                            criterion: item.criterion,
                            maxPoints: item.maxPoints,
                            order: item.order
                        }
                    });
                }
            }
        });

        revalidatePath(`/dashboard/professor/projects/[id]`); // Revalidate generally
        return { success: true };
    } catch (e) {
        console.error("Error saving rubric:", e);
        return { success: false, error: 'Error al guardar rúbrica' };
    }
}

export async function gradeSubmissionAction(submissionId: string, scores: { rubricItemId: string; score: number; feedback?: string }[]) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        const totalGrade = scores.reduce((sum, s) => sum + s.score, 0);

        await prisma.$transaction(async (tx) => {
            // 1. Save individual rubric scores
            for (const s of scores) {
                await tx.rubricScore.upsert({
                    where: {
                        submissionId_rubricItemId: {
                            submissionId,
                            rubricItemId: s.rubricItemId
                        }
                    },
                    create: {
                        submissionId,
                        rubricItemId: s.rubricItemId,
                        score: s.score,
                        feedback: s.feedback
                    },
                    update: {
                        score: s.score,
                        feedback: s.feedback
                    }
                });
            }

            // 2. Update total grade on submission
            await tx.submission.update({
                where: { id: submissionId },
                data: {
                    grade: totalGrade,
                    feedback: `Calificación final calculada por rúbrica: ${totalGrade}`
                }
            });
        });

        revalidatePath('/dashboard/assignments');
        return { success: true };
    } catch (e) {
        console.error("Error grading submission:", e);
        return { success: false, error: 'Error al calificar' };
    }
}
