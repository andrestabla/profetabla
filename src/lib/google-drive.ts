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
            scopes: ['https://www.googleapis.com/auth/drive'],

            subject: config.googleDriveAdminEmail || undefined
        });

        console.log(`[GoogleDrive] Initializing client. Admin delegation email: ${config.googleDriveAdminEmail ? 'PRESENT' : 'MISSING'}.`);

        return google.drive({ version: 'v3', auth });
    } catch (error) {
        console.error("Error initializing Google Drive client:", error);
        throw error;
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
            supportsAllDrives: true,
        });

        return response.data.id;
    } catch (error) {
        console.error("Error creating Google Drive folder:", error);
        return null;
    }
}

/**
 * Creates a generic folder in Google Drive.
 */
export async function createFolder(name: string, parentId: string) {
    try {
        const drive = await getDriveClient();
        const fileMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        };
        const response = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
            supportsAllDrives: true,
        });
        return response.data.id;
    } catch (error) {
        console.error("Error creating folder:", error);
        throw error; // Throw so checking logic can see the real error
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
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });
        return response.data.files || [];
    } catch (error) {
        console.error("Error listing Drive files:", error);
        return [];
    }
}

/**
 * Gets the content of a file for AI processing.
 */
export async function getFileContent(fileId: string, mimeType: string) {
    try {
        const drive = await getDriveClient();

        if (mimeType.includes('google-apps.document')) {
            const response = await drive.files.export({
                fileId: fileId,
                mimeType: 'text/plain',
            }, { responseType: 'text' });
            return response.data as string;
        }

        // For other files, we just return the name for now if we can't parse content easily
        const file = await drive.files.get({
            fileId: fileId,
            fields: 'name,description',
            supportsAllDrives: true
        });
        return `Nombre del archivo: ${file.data.name}\nDescripción: ${file.data.description || 'Sin descripción'}`;

    } catch (error) {
        console.error("Error fetching file content:", error);
        return null;
    }
}

/**
 * Uploads a file to a specific Google Drive folder.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function uploadFileToDrive(folderId: string, fileName: string, mimeType: string, body: any) {
    try {
        console.log(`Iniciando uploadFileToDrive para "${fileName}" en folder "${folderId}"`);
        const drive = await getDriveClient();

        const fileMetadata = {
            name: fileName,
            parents: [folderId]
        };

        const media = {
            mimeType: mimeType,
            body: body
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink',
            supportsAllDrives: true,
        });

        console.log(`Archivo creado en Drive. ID: ${response.data.id}`);

        // Set permissions to anyone with link (optional, but useful for resources)
        await drive.permissions.create({
            fileId: response.data.id!,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
            supportsAllDrives: true,
        });

        console.log(`Permisos 'anyone' establecidos para ${response.data.id}`);

        return response.data;
    } catch (error) {
        console.error("Error uploading file to Google Drive:", error);
        throw error; // Throw so actions catch it
    }
}

/**
 * Deletes a file or folder from Google Drive.
 */
export async function deleteFolder(fileId: string) {
    try {
        console.log(`Intentando eliminar archivo/carpeta de Drive: ${fileId}`);
        const drive = await getDriveClient();
        await drive.files.delete({
            fileId: fileId
        });
        console.log(`Archivo/Carpeta eliminada de Drive: ${fileId}`);
        return true;
    } catch (error) {
        console.error("Error deleting file from Drive:", error);
        return false;
    }
}
