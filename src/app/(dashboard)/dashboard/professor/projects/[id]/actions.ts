'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function addResourceToProjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') throw new Error('No autorizado');

    const projectId = formData.get('projectId') as string;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const url = formData.get('url') as string;

    // Creamos el recurso atado específicamente a este proyecto
    await prisma.resource.create({
        data: {
            title,
            type,
            url,
            projectId, // <-- EL PUNTO CLAVE: El contexto pedagógico
            // Categoría por defecto para simplificar. Buscamos cualquiera o creamos 'General' si no existe.
            categoryId: (await prisma.resourceCategory.findFirst())?.id || (await prisma.resourceCategory.create({ data: { name: 'General' } })).id
        }
    });

    // Recargamos la página del proyecto para mostrar el nuevo recurso sin recargar el navegador
    revalidatePath(`/dashboard/professor/projects/${projectId}`);
}
