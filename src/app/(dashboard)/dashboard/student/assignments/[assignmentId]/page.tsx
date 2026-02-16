import { prisma } from '@/lib/prisma';
import AssignmentDetailClient from './AssignmentDetailClient';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AssignmentDetailPage({ params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect('/auth/login');

    const { assignmentId } = await params;
    const userId = session.user.id;

    const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
            project: {
                select: { id: true, title: true }
            },
            task: {
                include: {
                    comments: true, // Needed? Maybe not, but checking
                }
            },
            rubricItems: {
                orderBy: { order: 'asc' }
            },
            submissions: {
                where: { studentId: userId },
                include: {
                    rubricScores: true
                }
            }
        },
    });

    if (!assignment) {
        return notFound();
    }

    // Transform dates to strings to avoid serialization issues
    const transformedAssignment = {
        ...assignment,
        dueDate: assignment.dueDate ? assignment.dueDate.toISOString() : null,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
        task: assignment.task ? {
            ...assignment.task,
            maxDate: assignment.task.maxDate ? assignment.task.maxDate.toISOString() : null,
            quizData: assignment.task.quizData ? JSON.parse(JSON.stringify(assignment.task.quizData)) : undefined,
            type: assignment.task.type as 'TASK' | 'QUIZ'
        } : null,
        submissions: assignment.submissions.map(sub => ({
            ...sub,
            createdAt: sub.createdAt.toISOString(),
            updatedAt: sub.updatedAt.toISOString(),
            answers: sub.answers ? JSON.parse(JSON.stringify(sub.answers)) : undefined
        })),
        rubricItems: assignment.rubricItems.map(ri => ({
            ...ri,
            createdAt: ri.createdAt.toISOString(),
            updatedAt: ri.updatedAt.toISOString()
        }))
    };

    return (
        <AssignmentDetailClient assignment={transformedAssignment} />
    );
}
