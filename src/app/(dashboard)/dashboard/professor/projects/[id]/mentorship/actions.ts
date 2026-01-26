'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function summonStudentAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') throw new Error('No autorizado');

    const projectId = formData.get('projectId') as string;
    const studentId = formData.get('studentId') as string;
    // In a real app, the teacher selects a slot. 
    // For this MVP, we'll find the first available slot of the teacher or create one on the fly.
    let slotId = formData.get('slotId') as string;
    const reason = formData.get('reason') as string;

    if (!slotId) {
        // Find or create a slot for "Tomorrow 10 AM" as default for the MVP demo
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        const endTime = new Date(tomorrow);
        endTime.setHours(11, 0, 0, 0);

        const newSlot = await prisma.mentorshipSlot.create({
            data: {
                teacherId: session.user.id,
                startTime: tomorrow,
                endTime: endTime,
                isBooked: false
            }
        });
        slotId = newSlot.id;
    }

    // Creamos la reserva con "superpoderes" de profesor
    await prisma.mentorshipBooking.create({
        data: {
            slotId,
            studentId,
            projectId, // Vinculado al proyecto
            note: `CITACIÓN OBLIGATORIA: ${reason}`,
            initiatedBy: 'TEACHER', // Clave para la analítica
            status: 'CONFIRMED',    // Nace confirmada porque el profesor es la autoridad
        }
    });

    // Actualizamos el Slot para que nadie más pueda tomarlo
    await prisma.mentorshipSlot.update({
        where: { id: slotId },
        data: { isBooked: true }
    });

    revalidatePath(`/dashboard/professor/projects/${projectId}`);
}
