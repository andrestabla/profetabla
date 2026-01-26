import { prisma } from '@/lib/prisma';
import MentorshipRoomClient from './MentorshipRoomClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string, bookingId: string }> }) {
    const { id, bookingId } = await params;

    const booking = await prisma.mentorshipBooking.findUnique({
        where: { id: bookingId },
        include: { slot: true }
    });

    if (!booking) return notFound();

    const project = await prisma.project.findUnique({
        where: { id },
        include: { student: true }
    });

    if (!project || !project.student) return notFound();

    return <MentorshipRoomClient booking={booking} student={project.student} project={project} />;
}
