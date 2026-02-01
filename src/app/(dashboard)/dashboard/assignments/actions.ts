'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { uploadFileToR2 } from '@/lib/r2';


export async function submitAssignmentAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: 'No autorizado' };

    const assignmentId = formData.get('assignmentId') as string;
    const submissionType = formData.get('submissionType') as 'FILE' | 'URL' || 'FILE';

    if (!assignmentId) return { success: false, error: 'Falta ID de asignación' };

    try {
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { project: true, task: { select: { id: true } } }
        });

        if (!assignment) return { success: false, error: 'Asignación no encontrada' };

        let fileUrl = '';
        let fileName = '';
        let fileType = '';
        let fileSize = 0;

        if (submissionType === 'URL') {
            const url = formData.get('url') as string;
            if (!url) return { success: false, error: 'Falta la URL' };
            // Simple validation
            try {
                new URL(url);
            } catch {
                return { success: false, error: 'URL inválida' };
            }
            fileUrl = url;
            fileName = 'Enlace Externo';
            fileType = 'URL';
            fileSize = 0;
        } else {
            const file = formData.get('file') as File;
            if (!file) return { success: false, error: 'Falta el archivo' };

            // Create buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to R2 (Plan C)
            const result = await uploadFileToR2(buffer, file.name, file.type, 'submissions');
            fileUrl = result.url;
            fileName = file.name;
            fileType = file.type;
            fileSize = file.size;
        }

        // Save to DB
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
            prisma.task.update({
                where: { id: assignment.task?.id }, // Needs include task in assignment fetch
                data: { status: 'SUBMITTED' }
            })
        ]);

        revalidatePath('/dashboard/assignments');
        revalidatePath('/dashboard/kanban'); // Sync kanban
        revalidatePath('/dashboard/grades');
        return { success: true };

    } catch (e: unknown) {
        console.error(e);
        const err = e as Error;
        return { success: false, error: err.message };
    }
}
