import { prisma } from '@/lib/prisma';
import ProjectMentorshipClient from './ProjectMentorshipClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, students: { select: { id: true } } }
    });

    if (!project || project.students.length === 0) return notFound();

    // Fetch Bookings with students and teacher info
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const bookings = await (prisma.mentorshipBooking as any).findMany({
        where: { projectId: id },
        include: {
            slot: { include: { teacher: true } },
            students: { select: { name: true, avatarUrl: true } }
        },
        orderBy: { slot: { startTime: 'asc' } }
    });

    // SIMULATED RISK ASSESSMENT LOGIC
    // In a real app we would calculate based on ItemInteractions vs Time
    // For MVP demo, if there are NO bookings, we assume 'HIGH' risk to show the button
    const riskLevel = bookings.length === 0 ? 'HIGH' : 'NORMAL';

    return (
        <ProjectMentorshipClient
            project={project}
            riskLevel={riskLevel}
            upcomingSessions={bookings as any[]}
        />
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
}
