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

    // If no mimeType provided (e.g. from ID extraction), try to fetch it
    if (!effectiveMimeType || effectiveMimeType === 'auto') {
        const metadata = await getFileMetadata(fileId);
        if (!metadata) return null; // File access error or not found
        effectiveMimeType = metadata.mimeType || 'application/octet-stream';
    }

    const content = await getFileContent(fileId, effectiveMimeType);
    if (!content) return null;

    return await extractOAMetadata(content);
}

export async function improveTextWithAIAction(title: string, context: string) {
    // Just provide the data, extractOAMetadata handles the instructions now
    const prompt = `
    DATOS DEL RECURSO:
    TÍTULO ACTUAL: ${title}
    CONTEXTO/URL/DESCRIPCIÓN: ${context}
    
    (Fin de los datos)
    `;
    return await extractOAMetadata(prompt);
}
