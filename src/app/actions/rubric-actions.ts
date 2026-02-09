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

import { sendEmail } from '@/lib/email';

export async function gradeSubmissionAction(submissionId: string, scores: { rubricItemId: string; score: number; feedback?: string }[], generalFeedback?: string, finalGrade?: number) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        const totalGrade = finalGrade !== undefined ? finalGrade : scores.reduce((sum, s) => sum + s.score, 0);

        // Transaction to save scores and update submission/task
        const result = await prisma.$transaction(async (tx) => {
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
            const submission = await tx.submission.update({
                where: { id: submissionId },
                data: {
                    grade: totalGrade,
                    feedback: generalFeedback || `Calificación final calculada por rúbrica: ${totalGrade}`
                },
                include: {
                    assignment: { include: { task: true } },
                    student: { select: { email: true, name: true } }
                }
            });

            // 3. Auto-move task to REVIEWED
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (submission.assignment?.task?.id && (submission.assignment.task.status as any) !== 'REVIEWED') {
                // Explicitly cast to any if TS is still complaining, though generate should fix it

                await tx.task.update({
                    where: { id: submission.assignment.task.id },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data: { status: 'REVIEWED' as any }
                });
            }

            return { email: submission.student.email, name: submission.student.name, taskTitle: submission.assignment.task?.title || submission.assignment.title };
        });

        // 4. Send Email Notification (Outside transaction)
        if (result?.email) {
            try {
                const html = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2563EB;">¡Tu entrega ha sido calificada!</h2>
                        <p>Hola <strong>${result.name || 'Estudiante'}</strong>,</p>
                        <p>Tu entrega para la tarea <strong>"${result.taskTitle}"</strong> ha sido revisada y calificada por el profesor.</p>
                        
                        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 18px; font-weight: bold;">Calificación: <span style="color: #2563EB;">${totalGrade} pts</span></p>
                        </div>

                        ${generalFeedback ? `
                        <div style="background-color: #EFF6FF; padding: 15px; border-radius: 8px; border-left: 4px solid #2563EB; margin-bottom: 20px;">
                            <h4 style="margin-top: 0; color: #1E40AF;">Feedback General:</h4>
                            <p style="margin-bottom: 0; font-style: italic;">"${generalFeedback}"</p>
                        </div>
                        ` : ''}

                        <p>Puedes ver el detalle de la rúbrica y los comentarios específicos en la plataforma.</p>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://profetabla.com/dashboard/student" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ver Calificación</a>
                        </div>
                    </div>
                `;

                await sendEmail({
                    to: result.email,
                    subject: `Calificación: ${result.taskTitle}`,
                    html
                });
                console.log(`Notification email sent to ${result.email}`);
            } catch (emailError) {
                console.error("Error sending notification email:", emailError);
            }
        }

        revalidatePath('/dashboard/assignments');
        revalidatePath('/dashboard/kanban');
        revalidatePath('/dashboard/grades');
        return { success: true };
    } catch (e: unknown) {
        console.error("Error grading submission:", e);
        const errorMessage = e instanceof Error ? e.message : 'Error al calificar';
        return { success: false, error: errorMessage };
    }
}
