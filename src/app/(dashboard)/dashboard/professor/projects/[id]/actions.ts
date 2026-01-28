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
        throw new Error(`Database error: ${e.message}`);
    }

    try {
        revalidatePath(`/dashboard/professor/projects/${projectId}`);
    } catch (e) {
        console.error('Revalidation error (non-fatal):', e);
    }

    return { success: true };
}

export async function getProjectDriveFilesAction(folderId: string) {
    console.log('--- getProjectDriveFilesAction ---', folderId);
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('No autorizado');
    try {
        const files = await listProjectFiles(folderId);
        console.log(`Encontrados ${files.length} archivos en Drive`);
        return files || [];
    } catch (e: any) {
        console.error('Error al listar archivos de Drive:', e);
        throw new Error(`Drive listing error: ${e.message}`);
    }
}

export async function uploadProjectFileToDriveAction(formData: FormData) {
    console.log('--- uploadProjectFileToDriveAction ---');
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') throw new Error('No autorizado');

    const projectId = formData.get('projectId') as string;
    const file = formData.get('file') as File;

    if (!file || !projectId) {
        throw new Error('Faltan datos requeridos (archivo o projectId)');
    }

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

    console.log(`Subiendo archivo "${file.name}" a Drive...`);

    let uploadedFile;
    try {
        uploadedFile = await uploadFileToDrive(
            (project as any).googleDriveFolderId,
            file.name,
            file.type,
            stream
        );
    } catch (e: any) {
        console.error('Error en uploadFileToDrive:', e);
        throw new Error(`Drive upload error: ${e.message}`);
    }

    if (!uploadedFile || !uploadedFile.webViewLink) {
        throw new Error('Error al obtener el enlace del archivo subido');
    }

    // Automatically create the resource link
    try {
        const firstCategory = await prisma.resourceCategory.findFirst();
        const categoryId = firstCategory?.id || (await prisma.resourceCategory.create({ data: { name: 'General' } })).id;

        await prisma.resource.create({
            data: {
                title: file.name,
                type: 'DRIVE',
                url: uploadedFile.webViewLink,
                projectId,
                categoryId: categoryId
            }
        });
    } catch (dbError: any) {
        console.error("Error al guardar el recurso en la base de datos:", dbError);
        throw new Error(`Database error after upload: ${dbError.message}`);
    }

    try {
        revalidatePath(`/dashboard/professor/projects/${projectId}`);
    } catch (e) {
        console.error('Revalidation error (non-fatal):', e);
    }

    return { success: true, file: uploadedFile };
}
