'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function acceptStudentAction(formData: FormData) {
    const applicationId = formData.get('applicationId') as string;
    const projectId = formData.get('projectId') as string;
    const studentId = formData.get('studentId') as string;

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
        await tx.project.update({
            where: { id: projectId },
            data: {
                students: {
                    connect: { id: studentId }
                },
                status: 'IN_PROGRESS'
            },
        });

        // D. (Opcional) Crear la primera tarea automática en el Kanban del proyecto
        // Check if task already exists? Maybe not needed for multiple students, 
        // but for now let's keep it simple. It might duplicate if multiple students are accepted.
        // Let's only create it if it's the first student? 
        // Or just create it. Having duplicate "Reunión Inicial" tasks might be annoying but acceptable.
        // Better: Check if project already has tasks?
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
    redirect(`/dashboard/professor/projects/${(await prisma.projectApplication.findUnique({ where: { id: applicationId } }))?.projectId}/applications`);
}
