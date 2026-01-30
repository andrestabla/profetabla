import { prisma } from '@/lib/prisma';
import AssignmentsTimelineClient from './AssignmentsTimelineClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/auth/login');

    // Determine query based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (session.user.role === 'STUDENT') {
        where.project = { students: { some: { id: session.user.id } } };
    } else {
        // Teachers see assignments for projects they own
        where.project = { teachers: { some: { id: session.user.id } } };
    }

    const assignments = await prisma.assignment.findMany({
        where,
        include: {
            project: { select: { id: true, title: true } },
            submissions: {
                where: { studentId: session.user.id }, // Only show own submissions even for teacher in this view? Or maybe all? For now, stick to simple valid query.
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                include: { rubricScores: true }
            },
            task: {
                select: { status: true, priority: true }
            },
            rubricItems: {
                orderBy: { order: 'asc' }
            }
        },
        orderBy: { dueDate: 'asc' }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <AssignmentsTimelineClient assignments={assignments as any} />;
}
