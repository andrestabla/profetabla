'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listProjectFiles, uploadFileToDrive } from '@/lib/google-drive';
import { Readable } from 'stream';

export async function addResourceToProjectAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') throw new Error('No autorizado');

    const projectId = formData.get('projectId') as string;
    const driveTitle = formData.get('driveTitle') as string;
    const title = driveTitle || (formData.get('title') as string);
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

export async function getProjectDriveFilesAction(folderId: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('No autorizado');
    return await listProjectFiles(folderId);
}

export async function uploadProjectFileToDriveAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') throw new Error('No autorizado');

    const projectId = formData.get('projectId') as string;
    const file = formData.get('file') as File;

    if (!file) throw new Error('No se proporcionó ningún archivo');

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { googleDriveFolderId: true }
    });

    if (!project?.googleDriveFolderId) {
        throw new Error('El proyecto no tiene una carpeta de Drive vinculada');
    }

    // Convert File to Buffer/Stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const uploadedFile = await uploadFileToDrive(
        project.googleDriveFolderId,
        file.name,
        file.type,
        stream
    );

    if (!uploadedFile) throw new Error('Error al subir el archivo a Google Drive');

    // Automatically create the resource link
    await prisma.resource.create({
        data: {
            title: file.name,
            type: 'DRIVE',
            url: uploadedFile.webViewLink!,
            projectId,
            categoryId: (await prisma.resourceCategory.findFirst())?.id || (await prisma.resourceCategory.create({ data: { name: 'General' } })).id
        }
    });

    revalidatePath(`/dashboard/professor/projects/${projectId}`);
    return { success: true, file: uploadedFile };
}
