'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function closeSessionAction(formData: FormData) {
    const bookingId = formData.get('bookingId') as string;
    const projectId = formData.get('projectId') as string;
    const minutes = formData.get('minutes') as string;
    const agreements = formData.get('agreements') as string;

    // Actualizamos la reserva con la información de la sesión
    await prisma.mentorshipBooking.update({
        where: { id: bookingId },
        data: {
            minutes,      // Guardamos el acta
            agreements,   // Guardamos los compromisos
            status: 'CONFIRMED', // Keeping CONFIRMED for now as schema update is pending, or we can use COMPLETED if we succeed in updating schema
            // We will switch to COMPLETED once schema is updated
        }
    });

    // (Opcional) Crear automáticamente una tarea en el Kanban con los acuerdos
    if (agreements && agreements.length > 10) {
        await prisma.task.create({
            data: {
                title: "Seguimiento de Acuerdos de Mentoría",
                description: agreements,
                priority: "HIGH",
                status: "TODO",
                projectId: projectId,
                isMandatory: true,
                assignment: {
                    create: {
                        title: "Entrega: Acuerdos de Mentoría",
                        description: `Evidencia de cumplimiento de los acuerdos: ${agreements}`,
                        projectId: projectId,
                        evaluationCriteria: "Cumplimiento de acuerdos pactados en sesión."
                    }
                }
            }
        });
    }

    // Redirigir al panel de mentorías del proyecto
    redirect(`/dashboard/professor/projects/${projectId}/mentorship`);
}
