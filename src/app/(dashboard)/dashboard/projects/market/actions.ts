'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function applyToProjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);

    // Validar que sea un estudiante logueado
    if (!session || session.user.role !== 'STUDENT') {
        throw new Error('Solo los estudiantes pueden aplicar a proyectos.');
    }

    const projectId = formData.get('projectId') as string;
    const motivation = formData.get('motivation') as string;

    // Verificar si ya aplicó para evitar duplicados
    const existingApplication = await prisma.projectApplication.findUnique({
        where: {
            projectId_studentId: {
                projectId,
                studentId: session.user.id
            }
        }
    });

    if (existingApplication) {
        throw new Error('Ya has aplicado a este proyecto.');
    }

    // Crear la postulación
    await prisma.projectApplication.create({
        data: {
            projectId,
            studentId: session.user.id,
            motivation,
            status: 'PENDING'
        }
    });

    // Redirigir al estudiante a un panel de "Mis Postulaciones" (o dashboard por ahora)
    redirect('/dashboard');
}
