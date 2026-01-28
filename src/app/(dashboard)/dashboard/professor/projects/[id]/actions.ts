'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listProjectFiles, uploadFileToDrive } from '@/lib/google-drive';
import { Readable } from 'stream';
import { GoogleGenerativeAI } from "@google/generative-ai";

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

export async function extractResourceMetadataAction(url: string, type: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: 'No autorizado' };

        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
        const apiKey = config?.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        if (!apiKey) return { success: false, error: 'API Key de Gemini no configurada' };

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: config?.geminiModel || "gemini-1.5-flash" });

        const prompt = `
            Analiza este recurso (${type}): ${url}
            Extrae o sugiere metadatos pedagógicos.
            Responde ÚNICAMENTE con un JSON con esta estructura:
            {
              "title": "Nombre claro del recurso",
              "presentation": "Breve descripción de qué es este recurso (2-3 líneas)",
              "utility": "Explicación de para qué sirve este recurso en un contexto de aprendizaje (2-3 líneas)"
            }
            Si no puedes acceder al contenido, sugiere basándote en la URL o el título.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonString);

        return { success: true, data };
    } catch (e: unknown) {
        console.error('Error en extractResourceMetadataAction:', e);
        return { success: false, error: 'No se pudo extraer metadatos automáticamente' };
    }
}
