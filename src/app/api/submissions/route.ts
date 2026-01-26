import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        // We technically allow teachers to submit on behalf? No, usually students.
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { assignmentId, fileUrl, fileName, fileType, fileSize } = body;

        const submission = await prisma.submission.create({
            data: {
                assignmentId,
                studentId: session.user.id,
                fileUrl,
                fileName,
                fileType,
                fileSize
            }
        });

        await logActivity(session.user.id, 'UPLOAD_SUBMISSION', `Subió la entrega: "${fileName}"`);

        return NextResponse.json(submission);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Error submitting file' },
            { status: 500 }
        );
    }
}
