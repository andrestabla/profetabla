import { prisma } from '@/lib/prisma';
import MentorshipRoomClient from './MentorshipRoomClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string, bookingId: string }> }) {
    const { id, bookingId } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: { students: true }
    });

    if (!project || project.students.length === 0) return notFound();

    // For 1-on-1 mentorship, we might assume the student is the one in the booking?
    // But bookings track 'studentId'.
    // The client expects 'student' prop.
    // Let's verify if the booking student is in the project.

    // Actually, MentorshipRoomClient takes 'student' (User). 
    // If the booking has studentId, we should probably fetch the student FROM THE BOOKING, or ensure we pass the correct one.
    // The previous code used project.student, suggesting 1 student per project.
    // Now we have many.
    // However, the booking ITSELF has a studentId (MentorshipBooking model). 
    // And we already fetched booking with `include: { slot: true }`. Let's add student to booking include.

    // Changing approach slightly: Fetch students from Booking, not Project.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const bookingWithStudents = await (prisma.mentorshipBooking as any).findUnique({
        where: { id: bookingId },
        include: { slot: true, students: true }
    });

    if (!bookingWithStudents) return notFound();

    const student = bookingWithStudents.students?.[0] || { name: 'Estudiante no asignado', id: 'na' };

    return (
        <MentorshipRoomClient
            booking={bookingWithStudents}
            student={student}
            project={project}
        />
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
}
