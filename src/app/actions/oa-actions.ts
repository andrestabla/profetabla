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

export async function processDriveFileForOAAction(fileId: string, mimeType: string) {
    const content = await getFileContent(fileId, mimeType);
    if (!content) return null;

    return await extractOAMetadata(content);
}
