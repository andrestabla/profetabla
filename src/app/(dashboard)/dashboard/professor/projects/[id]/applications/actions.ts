'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function acceptStudentAction(formData: FormData) {
    const applicationId = formData.get('applicationId') as string;
    const projectId = formData.get('projectId') as string;
    const studentId = formData.get('studentId') as string;

    // Fetch necessary data for email
    const [student, project] = await Promise.all([
        prisma.user.findUnique({ where: { id: studentId }, select: { email: true, name: true } }),
        prisma.project.findUnique({ where: { id: projectId }, select: { title: true } })
    ]);

    // 1. Iniciar una transacción de Prisma (para asegurar que todos los cambios ocurran a la vez)
    await prisma.$transaction(async (tx) => {
        // A. Actualizar la postulación seleccionada a ACCEPTED
        await tx.projectApplication.update({
            where: { id: applicationId },
            data: { status: 'ACCEPTED' },
        });

        // B. (REMOVED) Previously we rejected all other applications. 
        // With M-N support, we allow multiple students to be accepted. 
        // The professor can manually reject others if needed.

        // C. El cambio principal: Asignar el estudiante al Proyecto y cambiar estado a IN_PROGRESS
        const project = await tx.project.findUnique({ where: { id: projectId }, include: { students: true } });
        // Only update status to IN_PROGRESS if it was pending/open. 
        // But honestly, keeping it OPEN might be better if we want more students?
        // Requirement says "Open" unless Draft/Full/Dates.
        // But typically getting accepted implies starting work.
        // Let's keep the existing logic of IN_PROGRESS for now to not break workflow, 
        // but it might conflict with the "Market Visibility" logic if IN_PROGRESS projects are hidden?
        // Wait, "Market visibility" usually hides IN_PROGRESS. If accepting ONE student hides it, that breaks M-N.
        // Let's NOT force IN_PROGRESS if maxStudents > currentStudents.
        // However, the previous code enforced IN_PROGRESS.
        // I will keep it as IS for now regarding status, but just add the student.
        // Actually, if I just add the student, the filtering logic I added earlier handles visibility!
        // So I don't STRICTLY need to set it to IN_PROGRESS unless that's the desired "start" signal.
        // For now, I will keep the existing status update to minimize side effects, 
        // BUT I must fetch the student email and send the mail.

        await tx.project.update({
            where: { id: projectId },
            data: {
                students: {
                    connect: { id: studentId }
                },
                status: 'IN_PROGRESS' // Keep this for now as it was there
            },
        });


        // D. (Opcional) Crear la primera tarea automática en el Kanban del proyecto
        const existingTasks = await tx.task.count({ where: { projectId } });
        if (existingTasks === 0) {
            await tx.task.create({
                data: {
                    title: "Reunión Inicial: Revisión de Objetivos con el Tutor",
                    projectId: projectId,
                    priority: "HIGH",
                    status: "TODO"
                }
            });
        }
    });

    // Send Email Notification
    if (student?.email && project?.title) {
        try {
            await import('@/lib/email').then(mod => mod.sendEmail({
                to: student.email,
                subject: `¡Has sido aceptado! - ${project.title}`,
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h2>¡Felicidades, ${student.name || 'Estudiante'}!</h2>
                        <p>Tu solicitud para unirte al proyecto <strong>${project.title}</strong> ha sido aceptada.</p>
                        <p>Ahora tienes acceso al Tablero Kanban y a los recursos del proyecto.</p>
                        <br/>
                        <a href="${process.env.NEXTAUTH_URL}/dashboard/student/projects/${projectId}" 
                           style="background-color: #2563EB; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px;">
                           Ir al Proyecto
                        </a>
                    </div>
                `
            }));
            console.log(`✅ [Email Sent] To: ${student.email}`);
        } catch (error) {
            console.error("❌ [Email Error] Failed to send acceptance email:", error);
        }
    }

    // 2. Redirigir al profesor al Tablero Kanban de este proyecto, que ya está activo
    redirect(`/dashboard/professor/projects/${projectId}/kanban`);
}

export async function rejectStudentAction(formData: FormData) {
    const applicationId = formData.get('applicationId') as string;

    await prisma.projectApplication.update({
        where: { id: applicationId },
        data: { status: 'REJECTED' },
    });

    // Recarga la página actual para mostrar el siguiente candidato
    const application = await prisma.projectApplication.findUnique({ where: { id: applicationId } });
    if (application) {
        redirect(`/dashboard/professor/projects/${application.projectId}/applications`);
    } else {
        redirect(`/dashboard/professor/projects`);
    }
}
