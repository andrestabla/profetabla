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
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) return { success: false, error: 'No autorizado' };

        const projectId = formData.get('projectId') as string;
        const driveTitle = formData.get('driveTitle') as string;
        const title = driveTitle || (formData.get('title') as string);
        const type = formData.get('type') as string;
        const url = formData.get('url') as string;
        const presentation = formData.get('presentation') as string;
        const utility = formData.get('utility') as string;

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
                presentation,
                utility,
                categoryId: categoryId
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.error('Error en addResourceToProjectAction:', error);
        return { success: false, error: error.message || 'Error desconocido al crear recurso' };
    }
}


export async function updateProjectResourceAction(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) return { success: false, error: 'No autorizado' };

        const resourceId = formData.get('resourceId') as string;
        const projectId = formData.get('projectId') as string;
        const driveTitle = formData.get('driveTitle') as string;
        const title = driveTitle || (formData.get('title') as string);
        const type = formData.get('type') as string;
        const url = formData.get('url') as string;
        const presentation = formData.get('presentation') as string;
        const utility = formData.get('utility') as string;

        if (!resourceId || !projectId || !title || !url) {
            return { success: false, error: 'Faltan datos requeridos para actualizar' };
        }

        await prisma.resource.update({
            where: { id: resourceId },
            data: {
                title,
                type,
                url,
                presentation,
                utility,
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.error('Error en updateProjectResourceAction:', error);
        return { success: false, error: error.message || 'Error desconocido al actualizar recurso' };
    }
}

export async function getProjectDriveFilesAction(folderId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) throw new Error('No autorizado');

        const files = await listProjectFiles(folderId);
        return files || [];
    } catch (e: unknown) {
        console.error('Error en getProjectDriveFilesAction:', e);
        throw e;
    }
}

export async function uploadProjectFileToDriveAction(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) return { success: false, error: 'No autorizado' };

        const projectId = formData.get('projectId') as string;
        const file = formData.get('file') as File;
        const presentation = formData.get('presentation') as string;
        const utility = formData.get('utility') as string;

        if (!file || !projectId) {
            return { success: false, error: 'Faltan datos requeridos (archivo o projectId)' };
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { googleDriveFolderId: true }
        });

        if (!project?.googleDriveFolderId) {
            return { success: false, error: 'El proyecto no tiene una carpeta de Drive vinculada' };
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = Readable.from(buffer);

        console.log(`Subiendo archivo "${file.name}" a Drive...`);

        const uploadedFile = await uploadFileToDrive(
            project.googleDriveFolderId,
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
                presentation,
                utility,
                categoryId: categoryId
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true, file: uploadedFile };
    } catch (e: unknown) {
        const error = e as Error;
        console.error('Error en uploadProjectFileToDriveAction:', error);
        return { success: false, error: error.message || 'Error desconocido al subir archivo' };
    }
}

export async function uploadProjectFileToR2Action(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) return { success: false, error: 'No autorizado' };

        const projectId = formData.get('projectId') as string;
        const file = formData.get('file') as File;
        const presentation = formData.get('presentation') as string;
        const utility = formData.get('utility') as string;

        if (!file || !projectId) {
            return { success: false, error: 'Faltan datos requeridos' };
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { uploadFileToR2 } = await import('@/lib/r2');
        const { key } = await uploadFileToR2(buffer, file.name, file.type, projectId);

        const category = await prisma.resourceCategory.findFirst();
        const categoryId = category?.id || (await prisma.resourceCategory.create({ data: { name: 'General' } })).id;

        await prisma.resource.create({
            data: {
                title: file.name,
                type: 'FILE',
                url: key, // Store the R2 key
                projectId,
                presentation,
                utility,
                categoryId: categoryId
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.error('Error en uploadProjectFileToR2Action:', error);
        return { success: false, error: error.message || 'Error al subir archivo a R2' };
    }
}





// Replaces the entire legacy function with a wrapper around the robust shared action
export async function extractResourceMetadataAction(url: string, type: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'No autorizado' };

        // For Drive files, the URL might be a webViewLink, but we might want the fileId.
        // However, improveTextWithAIAction handles YouTube/URL context nicely.
        // If type is DRIVE, the 'url' passed here is often the webLink.

        // Import shared action dynamically to avoid circular deps if any (though likely fine)
        const { improveTextWithAIAction, processDriveFileForOAAction } = await import('@/app/actions/oa-actions');

        let data;

        if (type === 'DRIVE') {
            // Check if we can extract ID
            const fileId = url.match(/[-\w]{25,}/)?.[0];
            if (fileId) {
                // Use the specific drive processor which auto-resolves mimeTypes
                data = await processDriveFileForOAAction(fileId, 'auto');
            } else {
                // Fallback to text analysis if ID fails
                data = await improveTextWithAIAction("Documento de Drive", `URL: ${url}\nTipo: ${type}`);
            }
        } else {
            // For Video, Article, Embed -> Use the unified improver
            data = await improveTextWithAIAction("Nuevo Recurso", `URL: ${url}\nTipo: ${type}`);
        }

        if (data) {
            return {
                success: true,
                data: {
                    title: data.title,
                    presentation: data.presentation,
                    utility: data.utility,
                    subject: data.subject,
                    competency: data.competency,
                    keywords: data.keywords
                }
            };
        }

        return { success: false, error: 'No se pudo generar información con la IA.' };

    } catch (e: unknown) {
        const error = e as Error;
        console.error('Error en extractResourceMetadataAction:', error);
        return { success: false, error: error.message || 'Error desconocido al procesar con IA' };
    }
}

export async function getAvailableLearningObjectsAction(projectId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return [];

        // Fetch OAs created by the user (or all if admin) that are NOT yet linked to this project
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {
            projects: {
                none: { id: projectId }
            }
        };

        if (session.user.role !== 'ADMIN') {
            whereClause.authorId = session.user.id;
        }

        const oas = await prisma.learningObject.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                description: true,
                subject: true,
                items: {
                    select: { type: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return oas;
    } catch (error) {
        console.error('Error in getAvailableLearningObjectsAction:', error);
        return [];
    }
}

export async function linkLearningObjectToProjectAction(projectId: string, oaId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['TEACHER', 'ADMIN'].includes(session.user.role)) {
            return { success: false, error: 'No autorizado' };
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
                learningObjects: {
                    connect: { id: oaId }
                }
            }
        });

        revalidatePath(`/dashboard/professor/projects/${projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Error in linkLearningObjectToProjectAction:', error);
        return { success: false, error: 'Error al vincular el OA' };
    }
}
