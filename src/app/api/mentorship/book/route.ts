import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateMeetLink, generateMeetLinkWithEvent } from '@/lib/google-meet';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { slotId, note, projectId: overtProjectId, studentIds: overtStudentIds } = body;

        // Find Project context
        let projectId = overtProjectId;
        if (!projectId && session.user.role === 'STUDENT') {
            const activeProject = await prisma.project.findFirst({
                where: {
                    students: { some: { id: session.user.id } },
                    status: 'IN_PROGRESS'
                }
            });
            projectId = activeProject?.id;
        }

        if (!projectId) {
            return NextResponse.json({ error: 'Project context is required' }, { status: 400 });
        }

        // Validate Slot and Teacher Affiliation
        const slot = await prisma.mentorshipSlot.findUnique({
            where: { id: slotId },
            include: { teacher: true }
        });

        if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });

        // Check if teacher is part of the project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                teachers: { some: { id: slot.teacherId } }
            },
            include: {
                teachers: { select: { id: true, name: true, email: true } },
                students: { select: { id: true, name: true, email: true } }
            }
        });

        if (!project) {
            return NextResponse.json({ error: 'El profesor seleccionado no forma parte de este proyecto' }, { status: 403 });
        }

        // REFINED BOOKING LIMIT LOGIC
        if (session.user.role === 'STUDENT') {
            // Count tasks created by/assigned to this student in this project
            const taskCount = await prisma.task.count({
                where: {
                    projectId,
                    assignees: { some: { id: session.user.id } }
                }
            });

            // Count existing bookings for this student in this project
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bookingCount = await (prisma.mentorshipBooking as any).count({
                where: {
                    projectId,
                    students: { some: { id: session.user.id } }
                }
            });

            // Students can book 1 mentorship per task they have
            if (bookingCount >= taskCount) {
                return NextResponse.json({
                    error: `Has alcanzado el límite de mentorías (${bookingCount}/${taskCount}). Crea más tareas en tu tablero Kanban para solicitar más mentorías.`
                }, { status: 400 });
            }
        }

        // For teachers/admins: no booking limits

        const studentIds = overtStudentIds || [session.user.id];

        // Get student emails for calendar event
        const students = project.students.filter(s => studentIds.includes(s.id));
        const studentEmails = students.map(s => s.email).filter((e): e is string => !!e);

        // Generate Google Meet link with calendar event
        let meetingUrl: string;
        let googleEventId: string | undefined;

        try {
            console.log(`[Booking] Generating Meet link for teacher: ${slot.teacher.email || 'NO EMAIL'}`);
            const result = await generateMeetLinkWithEvent({
                summary: `Mentoría - ${project.title}`,
                description: `Mentoría para el proyecto "${project.title}".\n\nEstudiantes: ${students.map(s => s.name).join(', ')}\nProfesor: ${slot.teacher.name}\n\nNotas: ${note || 'Sin notas'}`,
                startTime: slot.startTime,
                endTime: slot.endTime
                // NOTE: Attendees removed - service accounts cannot invite without Domain-Wide Delegation
            }, slot.teacher.email || undefined);
            meetingUrl = result.meetLink;
            googleEventId = result.googleEventId;
        } catch (error) {
            console.error('Error generating Meet link with event:', error);
            meetingUrl = generateMeetLink();
        }

        const booking = await prisma.$transaction(async (tx) => {
            // Optimistic Update: Check isBooked
            const updateResult = await tx.mentorshipSlot.updateMany({
                where: { id: slotId, isBooked: false },
                data: {
                    isBooked: true,
                    meetingUrl,
                    googleEventId,
                    version: { increment: 1 }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any
            });

            if (updateResult.count === 0) throw new Error('SLOT_ALREADY_BOOKED');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (tx.mentorshipBooking as any).create({
                data: {
                    slotId,
                    projectId,
                    note,
                    status: 'CONFIRMED',
                    initiatedBy: session.user.role,
                    students: {
                        connect: studentIds.map((id: string) => ({ id }))
                    }
                }
            });
        });

        return NextResponse.json(booking);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error("Booking error:", e);
        return NextResponse.json({ error: e.message || 'Error booking slot' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { slotId, note } = body;

        // Ensure user owns the booking or is teacher/admin
        const booking = await prisma.mentorshipBooking.findUnique({
            where: { slotId }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const isTeacher = session.user.role === 'TEACHER' || session.user.role === 'ADMIN';
        if (!isTeacher) {
            return NextResponse.json({ error: 'Only teachers or admins can edit session notes currently' }, { status: 403 });
        }

        const updated = await prisma.mentorshipBooking.update({
            where: { slotId },
            data: { note }
        });

        return NextResponse.json(updated);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error("Update booking error:", e);
        return NextResponse.json({ error: e.message || 'Error updating booking' }, { status: 500 });
    }
}
