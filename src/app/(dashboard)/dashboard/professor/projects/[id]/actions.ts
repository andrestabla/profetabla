'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listProjectFiles, uploadFileToDrive } from '@/lib/google-drive';
import { Readable } from 'stream';

export async function addResourceToProjectAction(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'TEACHER') return { success: false, error: 'No autorizado' };

        const projectId = formData.get('projectId') as string;
        const driveTitle = formData.get('driveTitle') as string;
        const title = driveTitle || (formData.get('title') as string);
        const type = formData.get('type') as string;
        const url = formData.get('url') as string;

        console.log('--- addResourceToProjectAction ---');
        console.log('Project:', projectId, 'Title:', title, 'Type:', type, 'URL:', url);

        if (!projectId || !title || !url) {
            return { success: false, error: `Faltan datos requeridos: ${!projectId ? 'ProjectID ' : ''}${!title ? 'Title ' : ''}${!url ? 'URL' : ''}` };
        }

        const category = await prisma.resourceCategory.findFirst();
        const categoryId = category?.id || (await prisma.resourceCategory.create({ data: { name: 'General' } })).id;

        await prisma.resource.create({
            data: {
                title,
                type,
                url,
                projectId,
                categoryId: categoryId
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true };
    } catch (e: any) {
        console.error('Error en addResourceToProjectAction:', e);
        return { success: false, error: e.message || 'Error desconocido al crear recurso' };
    }
}

export async function getProjectDriveFilesAction(folderId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) throw new Error('No autorizado');

        const files = await listProjectFiles(folderId);
        return files || [];
    } catch (e: any) {
        console.error('Error en getProjectDriveFilesAction:', e);
        // We throw here because this is usually called during render or client-side fetch, 
        // but for safety in the new pattern, we could return an empty array too.
        throw e;
    }
}

export async function uploadProjectFileToDriveAction(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'TEACHER') return { success: false, error: 'No autorizado' };

        const projectId = formData.get('projectId') as string;
        const file = formData.get('file') as File;

        if (!file || !projectId) {
            return { success: false, error: 'Faltan datos requeridos (archivo o projectId)' };
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { googleDriveFolderId: true }
        });

        if (!(project as any)?.googleDriveFolderId) {
            return { success: false, error: 'El proyecto no tiene una carpeta de Drive vinculada' };
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = Readable.from(buffer);

        console.log(`Subiendo archivo "${file.name}" a Drive...`);

        const uploadedFile = await uploadFileToDrive(
            (project as any).googleDriveFolderId,
            file.name,
            file.type,
            stream
        );

        if (!uploadedFile || !uploadedFile.webViewLink) {
            return { success: false, error: 'Error al obtener el enlace del archivo subido de Drive' };
        }

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

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true, file: uploadedFile };
    } catch (e: any) {
        console.error('Error en uploadProjectFileToDriveAction:', e);
        return { success: false, error: e.message || 'Error desconocido al subir archivo' };
    }
}
