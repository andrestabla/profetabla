import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { assignmentId, fileUrl, fileName, fileType, fileSize, studentId } = body;

        // MVP Hack: If no studentId, grab the first student
        let sid = studentId;
        if (!sid) {
            const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
            sid = student?.id;
        }

        const submission = await prisma.submission.create({
            data: {
                assignmentId,
                studentId: sid,
                fileUrl,
                fileName,
                fileType,
                fileSize
            }
        });

        if (sid) {
            await logActivity(sid, 'UPLOAD_SUBMISSION', `Subió la entrega: "${fileName}"`);
        }

        return NextResponse.json(submission);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Error submitting file' },
            { status: 500 }
        );
    }
}
