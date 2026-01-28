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

    console.log('--- addResourceToProjectAction ---');
    console.log('Project:', projectId, 'Title:', title, 'Type:', type, 'URL:', url);

    if (!projectId || !title || !url) {
        console.error('Faltan datos requeridos en addResourceToProjectAction');
        throw new Error(`Faltan datos requeridos: ${!projectId ? 'ProjectID ' : ''}${!title ? 'Title ' : ''}${!url ? 'URL' : ''}`);
    }

    try {
        const category = await prisma.resourceCategory.findFirst();
        const categoryId = category?.id || (await prisma.resourceCategory.create({ data: { name: 'General' } })).id;

        // Creamos el recurso atado específicamente a este proyecto
        await prisma.resource.create({
            data: {
                title,
                type,
                url,
                projectId,
                categoryId: categoryId
            }
        });
        console.log('Recurso creado con éxito en la base de datos');
    } catch (e: any) {
        console.error('Error al crear recurso en DB:', e);
        throw new Error(`Error de base de datos: ${e.message}`);
    }

    // Recargamos la página del proyecto para mostrar el nuevo recurso sin recargar el navegador
    revalidatePath(`/dashboard/professor/projects/${projectId}`);
}

export async function getProjectDriveFilesAction(folderId: string) {
    console.log('--- getProjectDriveFilesAction ---', folderId);
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('No autorizado');
    try {
        const files = await listProjectFiles(folderId);
        console.log(`Encontrados ${files.length} archivos en Drive`);
        return files;
    } catch (e: any) {
        console.error('Error al listar archivos de Drive:', e);
        throw new Error(`Error de Drive: ${e.message}`);
    }
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

    if (!(project as any)?.googleDriveFolderId) {
        throw new Error('El proyecto no tiene una carpeta de Drive vinculada');
    }

    // Convert File to Buffer/Stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    console.log(`Subiendo archivo "${file.name}" de tipo "${file.type}" a la carpeta "${(project as any).googleDriveFolderId}"`);

    const uploadedFile = await uploadFileToDrive(
        (project as any).googleDriveFolderId,
        file.name,
        file.type,
        stream
    );

    if (!uploadedFile) {
        console.error("Fallo la subida a Drive: uploadFileToDrive retornó null");
        throw new Error('Error al subir el archivo a Google Drive (Servicio no disponible)');
    }

    // Automatically create the resource link
    try {
        const firstCategory = await prisma.resourceCategory.findFirst();
        const categoryId = firstCategory?.id || (await prisma.resourceCategory.create({ data: { name: 'General' } })).id;

        await prisma.resource.create({
            data: {
                title: file.name,
                type: 'DRIVE',
                url: uploadedFile.webViewLink!,
                projectId,
                categoryId: categoryId
            }
        });
    } catch (dbError: any) {
        console.error("Error al guardar el recurso en la base de datos:", dbError);
        throw new Error(`Archivo subido a Drive pero falló el guardado en DB: ${dbError.message}`);
    }

    revalidatePath(`/dashboard/professor/projects/${projectId}`);
    return { success: true, file: uploadedFile };
}
