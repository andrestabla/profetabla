import { google } from 'googleapis';
import { prisma } from './prisma';

/**
 * Initializes the Google Drive client using credentials from PlatformConfig.
 */
async function getDriveClient() {
    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

    if (!config?.googleDriveServiceAccountJson) {
        throw new Error("Google Drive Service Account NOT configured.");
    }

    try {
        const credentials = JSON.parse(config.googleDriveServiceAccountJson);

        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/drive']
        });

        return google.drive({ version: 'v3', auth });
    } catch (error) {
        console.error("Error parsing Google Drive credentials:", error);
        throw new Error("Invalid Google Drive credentials format.");
    }
}

/**
 * Creates a folder in Google Drive for a project.
 * @param projectName The name of the project (folder name).
 * @returns The ID of the created folder.
 */
export async function createProjectFolder(projectName: string) {
    try {
        const drive = await getDriveClient();
        const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

        const parentFolderId = config?.googleDriveFolderId;

        const fileMetadata = {
            name: projectName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentFolderId ? [parentFolderId] : []
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        return response.data.id;
    } catch (error) {
        console.error("Error creating Google Drive folder:", error);
        return null;
    }
}

/**
 * Lists files in the project folder.
 */
export async function listProjectFiles(folderId: string) {
    try {
        const drive = await getDriveClient();
        const response = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, webViewLink, iconLink)',
        });
        return response.data.files || [];
    } catch (error) {
        console.error("Error listing Drive files:", error);
        return [];
    }
}
