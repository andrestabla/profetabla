'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadFileToR2, getPresignedPutUrl } from '@/lib/r2';

export async function getUploadUrlAction(fileName: string, fileType: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'No autorizado' };

    try {
        const { url, key } = await getPresignedPutUrl(fileName, fileType, 'submissions');
        return { success: true, url, key };
    } catch (error) {
        console.error('Error fetching presigned URL:', error);
        return { success: false, error: 'Error de configuración de almacenamiento' };
    }
}


export async function submitAssignmentAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: 'No autorizado' };

    const assignmentId = formData.get('assignmentId') as string;
    const submissionType = formData.get('submissionType') as 'FILE' | 'URL' | 'DIRECT_UPLOAD' || 'FILE';

    if (!assignmentId) return { success: false, error: 'Falta ID de asignación' };

    try {
        console.log('Starting submission for assignment:', assignmentId);

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { project: true, task: { select: { id: true } } }
        });

        if (!assignment) {
            console.error('Assignment not found:', assignmentId);
            return { success: false, error: 'Asignación no encontrada' };
        }

        let fileUrl = '';
        let fileName = '';
        let fileType = '';
        let fileSize = 0;

        if (submissionType === 'URL') {
            console.log('Processing URL submission');
            const url = formData.get('url') as string;
            if (!url) return { success: false, error: 'Falta la URL' };
            try {
                new URL(url);
            } catch {
                return { success: false, error: 'URL inválida' };
            }
            fileUrl = url;
            fileName = 'Enlace Externo';
            fileType = 'URL';
            fileSize = 0;
        } else if (submissionType === 'DIRECT_UPLOAD') {
            console.log('Processing Direct Upload submission');
            fileUrl = formData.get('fileUrl') as string;
            fileName = formData.get('fileName') as string;
            fileType = formData.get('fileType') as string;
            const sizeStr = formData.get('fileSize') as string;
            fileSize = sizeStr ? parseInt(sizeStr) : 0;

            if (!fileUrl) return { success: false, error: 'Falta la URL del archivo' };
        } else {
            console.log('Processing File submission');
            const file = formData.get('file') as File;
            if (!file) return { success: false, error: 'Falta el archivo' };

            // Create buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to R2 (Plan C)
            console.log('Uploading to R2...');
            try {
                const result = await uploadFileToR2(buffer, file.name, file.type, 'submissions');
                fileUrl = result.url;
                fileName = file.name;
                fileType = file.type;
                fileSize = file.size;
                console.log('R2 Upload success:', fileUrl);
            } catch (uploadError) {
                console.error('R2 Upload failed:', uploadError);
                return { success: false, error: 'Error al subir archivo a la nube' };
            }
        }

        // Save to DB
        console.log('Saving submission to DB...');
        await prisma.$transaction([
            prisma.submission.create({
                data: {
                    assignmentId,
                    studentId: session.user.id,
                    fileUrl,
                    fileName,
                    fileType,
                    fileSize
                }
            }),
            // Auto-move task to SUBMITTED
            ...(assignment.task ? [
                prisma.task.update({
                    where: { id: assignment.task.id },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data: { status: 'SUBMITTED' as any }
                })
            ] : [])
        ]);
        console.log('DB Transaction complete');

        revalidatePath('/dashboard/assignments');
        revalidatePath('/dashboard/kanban');
        revalidatePath('/dashboard/grades');
        return { success: true };

    } catch (e: unknown) {
        console.error('Submission Action Error:', e);
        const err = e as Error;
        return { success: false, error: err.message };
    }
}
