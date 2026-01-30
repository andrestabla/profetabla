'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createFolder, listProjectFiles, uploadFileToDrive } from '@/lib/google-drive';
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
            const newFolderId = await createFolder('Entregas', projectDriveId);
            if (newFolderId) {
                submissionsFolder = { id: newFolderId, name: 'Entregas' };
            }
        }

        if (!submissionsFolder?.id) return { success: false, error: 'No se pudo crear la carpeta de entregas' };

        // Upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = Readable.from(buffer);

        // Rename file to StudentName_AssignmentTitle_Filename
        const safeName = `${session.user.name || 'Estudiante'}_${assignment.title}_${file.name}`.replace(/[^a-zA-Z0-9._-]/g, '_');

        const uploaded = await uploadFileToDrive(submissionsFolder.id, safeName, file.type, stream);

        if (!uploaded?.webViewLink) return { success: false, error: 'Error al subir a Drive' };

        // Save to DB
        await prisma.submission.create({
            data: {
                assignmentId,
                studentId: session.user.id,
                fileUrl: uploaded.webViewLink,
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
