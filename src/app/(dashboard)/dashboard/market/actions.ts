'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function applyToProjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);

    try {
        // 1. Validar sesión
        if (!session || !session.user || session.user.role !== 'STUDENT') {
            throw new Error('Solo los estudiantes pueden aplicar a proyectos.');
        }

        const projectId = formData.get('projectId') as string;
        const motivation = formData.get('motivation') as string;

        if (!projectId) {
            throw new Error('El ID del proyecto es requerido.');
        }

        // 2. Verificar existencia y estado del proyecto
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { status: true }
        });

        if (!project) {
            throw new Error('El proyecto no existe.');
        }

        if (project.status !== 'OPEN') {
            throw new Error('Este proyecto ya no está aceptando aplicaciones (Estado: ' + project.status + ').');
        }

        // 3. Verificar si ya aplicó para evitar duplicados
        // Usamos findFirst como alternativa segura a findUnique con clave compuesta
        const existingApplication = await prisma.projectApplication.findFirst({
            where: {
                projectId,
                studentId: session.user.id
            }
        });

        if (existingApplication) {
            throw new Error('Ya has aplicado a este proyecto.');
        }

        // 4. Crear la postulación
        await prisma.projectApplication.create({
            data: {
                projectId,
                studentId: session.user.id,
                motivation,
                status: 'PENDING'
            }
        });

        // 5. Revalidar rutas críticas
        revalidatePath('/dashboard/market');
        revalidatePath('/dashboard/professor/projects');

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[applyToProjectAction Error]:', message);
        // Podríamos retornar un objeto de error si el form no fuera directo,
        // pero como es un action directo de un <form action={...}>,
        // Next.js lanzará el error a un componente 'error.tsx' si existe.
        // Por ahora, lanzamos el error para que sea capturado.
        throw error;
    }

    // 6. Redirigir fuera del try/catch (Next.js redirect lanza un error especial)
    redirect('/dashboard');
}
