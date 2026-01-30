'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createFolder, listProjectFiles, uploadFileToDrive } from '@/lib/google-drive';
import { uploadFileToR2 } from '@/lib/r2';
import { Readable } from 'stream';


export async function submitAssignmentAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: 'No autorizado' };

    const assignmentId = formData.get('assignmentId') as string;
    const file = formData.get('file') as File;

    if (!assignmentId || !file) return { success: false, error: 'Faltan datos' };

    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { project: true }
        });

        if (!assignment) return { success: false, error: 'Asignación no encontrada' };

        const projectDriveId = assignment.project.googleDriveFolderId;
        if (!projectDriveId) return { success: false, error: 'El proyecto no tiene carpeta de Drive' };

        // Check for 'Entregas' folder
        const files = await listProjectFiles(projectDriveId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let submissionsFolder: any = files.find((f: any) => f.name === 'Entregas' && f.mimeType === 'application/vnd.google-apps.folder');

        if (!submissionsFolder) {
            try {
                const newFolderId = await createFolder('Entregas', projectDriveId);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (newFolderId) {
                    submissionsFolder = { id: newFolderId, name: 'Entregas' };
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                return { success: false, error: `Error Drive: ${err.message || JSON.stringify(err)}` };
            }
        }

        if (!submissionsFolder?.id) return { success: false, error: 'No se pudo crear (ID nulo)' };

        // Create buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to R2 (Plan C)
        const { url, key } = await uploadFileToR2(buffer, file.name, file.type, 'submissions');

        // Save to DB
        await prisma.submission.create({
            data: {
                assignmentId,
                studentId: session.user.id,
                fileUrl: url, // Storing key/url
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            }
        });

        revalidatePath('/dashboard/assignments');
        return { success: true };

    } catch (e: unknown) {
        console.error(e);
        const err = e as Error;
        return { success: false, error: err.message };
    }
}
