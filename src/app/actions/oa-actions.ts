'use server';

import { getFileContent, listProjectFiles } from '@/lib/google-drive';
import { extractOAMetadata } from './ai-generator';
import { prisma } from '@/lib/prisma';

export async function getDriveFilesForOAAction() {
    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
    const folderId = config?.googleDriveFolderId;
    if (!folderId) return [];
    return await listProjectFiles(folderId);
}

// Helper to get file metadata if needed
import { google } from 'googleapis';

async function getFileMetadata(fileId: string) {
    try {
        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });
        if (!config?.googleDriveServiceAccountJson) return null;

        const credentials = JSON.parse(config.googleDriveServiceAccountJson);
        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = google.drive({ version: 'v3', auth });

        const file = await drive.files.get({ fileId, fields: 'id, mimeType, name' });
        return file.data;
    } catch (e) {
        console.error("Error getting file metadata:", e);
        return null;
    }
}

export async function processDriveFileForOAAction(fileId: string, mimeType?: string) {
    let effectiveMimeType = mimeType;

    try {
        // If no mimeType provided (e.g. from ID extraction), try to fetch it
        if (!effectiveMimeType || effectiveMimeType === 'auto') {
            const metadata = await getFileMetadata(fileId);
            if (!metadata) throw new Error(`Datos del archivo no accesibles (ID: ${fileId})`);
            effectiveMimeType = metadata.mimeType || 'application/octet-stream';
        }

        const content = await getFileContent(fileId, effectiveMimeType);
        if (!content) throw new Error('No se pudo leer el contenido del archivo');

        const result = await extractOAMetadata(content);
        if (!result) throw new Error('La IA no retornó datos válidos');

        return result;
    } catch (e) {
        console.error('Error processing Drive file:', e);
        throw e; // Propagate to extractResourceMetadataAction
    }
}

export async function improveTextWithAIAction(title: string, context: string) {
    // 1. Check for YouTube URL in context
    const youtubeMatch = context.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/);
    let extraContext = "";

    if (youtubeMatch) {
        try {
            const { getVideoDetails } = await import('@/lib/youtube');
            const details = await getVideoDetails(youtubeMatch[0]);

            if (details) {
                extraContext = `
                \n--- METADATOS REALES DE YOUTUBE ---
                Título del Video: ${details.title}
                Descripción del Canal: ${details.description}
                Etiquetas: ${details.tags.join(', ')}
                Canal: ${details.channelTitle}
                -------------------------------------
                `;
            }
        } catch (e) {
            console.error("Error enhancing with YouTube data:", e);
        }
    }

    const prompt = `
    DATOS DEL RECURSO:
    TÍTULO ACTUAL: ${title}
    CONTEXTO/URL/DESCRIPCIÓN: ${context}
    ${extraContext}
    
    (Fin de los datos)
    `;
    return await extractOAMetadata(prompt);
}
