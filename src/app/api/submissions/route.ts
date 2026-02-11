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

        if (type !== 'QUIZ' && !fileUrl) {
            return NextResponse.json({ error: 'File is required for standard assignments' }, { status: 400 });
        }

        // Fetch assignment to check if it's an auto-graded quiz
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { task: true }
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        let grade = undefined;
        let isAutoGraded = false;

        if (type === 'QUIZ' && assignment.task?.type === 'QUIZ') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const quizData = assignment.task.quizData as any;
            if (quizData?.gradingMethod === 'AUTO') {
                const { calculateTotalQuizScore } = await import('@/lib/quiz-utils');
                grade = calculateTotalQuizScore(quizData.questions || [], answers || {});
                isAutoGraded = true;
            }
        }

        const submission = await prisma.submission.create({
            data: {
                assignmentId,
                studentId: session.user.id,
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileType: fileType || null,
                fileSize: fileSize || null,
                answers: answers || undefined,
                grade: grade // Persist grade if calculated
            }
        });

        // If it was auto-graded, we should also move the task to REVIEWED status so it's consistent
        if (isAutoGraded && assignment.task?.id) {
            await prisma.task.update({
                where: { id: assignment.task.id },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data: { status: 'REVIEWED' as any }
            });
        }

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
