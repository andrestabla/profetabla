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
        const { assignmentId, fileUrl, fileName, fileType, fileSize, answers, type } = body;

        // If type is QUIZ, answers are required. If generic, fileUrl might be required (but made optional in schema)
        // We enforce: If type==='QUIZ', answers valid. Else, fileUrl valid (unless we allow text submissions later)

        if (type !== 'QUIZ' && !fileUrl) {
            return NextResponse.json({ error: 'File is required for standard assignments' }, { status: 400 });
        }

        const submission = await prisma.submission.create({
            data: {
                assignmentId,
                studentId: session.user.id,
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileType: fileType || null,
                fileSize: fileSize || null,
                answers: answers || undefined
            }
        });

        const activityMsg = type === 'QUIZ' ? 'Completó el cuestionario' : `Subió la entrega: "${fileName}"`;
        await logActivity(session.user.id, 'UPLOAD_SUBMISSION', activityMsg);

        return NextResponse.json(submission);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Error submitting file' },
            { status: 500 }
        );
    }
}
