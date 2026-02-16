import { prisma } from '@/lib/prisma';
import GradingClient from './GradingClient';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function GradingPage({ params }: { params: Promise<{ submissionId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/auth/login');

    const { submissionId } = await params;

    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            student: {
                select: {
                    name: true,
                    email: true,
                },
            },
            rubricScores: true,
            assignment: {
                include: {
                    project: true,
                    rubricItems: {
                        orderBy: { order: 'asc' },
                    },
                    task: true, // To access quiz data
                },
            },
        },
    });

    if (!submission) {
        return notFound();
    }

    // Safety check: Ensure the user is allowed to grade this (e.g., is a professor of the project)
    // For now assuming existing middleware/auth logic covers basic access, but ideally would check project membership here.

    const taskType = submission.assignment.task?.type;
    let computedType: 'FILE' | 'URL' | 'QUIZ' = 'FILE';
    if (taskType === 'QUIZ') {
        computedType = 'QUIZ';
    } else if (submission.fileType === 'URL') {
        computedType = 'URL';
    }

    // Transform data to match component expectations
    const transformedSubmission = {
        id: submission.id,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        answers: submission.answers ? JSON.parse(JSON.stringify(submission.answers)) : undefined, // Ensure handling JSON
        type: computedType,
        student: {
            name: submission.student.name,
            email: submission.student.email,
        },
        rubricScores: submission.rubricScores,
        feedback: submission.feedback,
    };

    const quizData = submission.assignment.task?.quizData
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (submission.assignment.task.quizData as any)
        : null;

    return (
        <GradingClient
            submission={transformedSubmission}
            rubricItems={submission.assignment.rubricItems}
            quizData={quizData}
            projectId={submission.assignment.projectId}
        />
    );
}
