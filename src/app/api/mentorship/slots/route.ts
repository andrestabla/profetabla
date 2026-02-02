/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addMinutes, isBefore, parseISO } from 'date-fns';
import { generateMeetLinkWithEvent, generateMeetLink } from '@/lib/google-meet';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const slots = await prisma.mentorshipSlot.findMany({
            include: {
                teacher: { select: { id: true, name: true, avatarUrl: true, email: true } },
                booking: {
                    include: {
                        students: { select: { id: true, name: true, avatarUrl: true } },
                        project: { select: { title: true } }
                    }
                } as any
            },
            orderBy: { startTime: 'asc' }
        });
        return NextResponse.json(slots);
    } catch (error) {
        console.error('Fetch slots error:', error);
        return NextResponse.json({ error: 'Error fetching slots' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Solo profesores o admins pueden crear horarios' }, { status: 403 });
        }

        const body = await request.json();
        const { startTime, endTime, meetingUrl, studentIds, projectId, note } = body;

        const start = parseISO(startTime);
        const end = parseISO(endTime);
        const SLOT_DURATION = 45;

        const teacherId = session.user.id;
        const slotsCreated: any[] = [];

        // Transaction is better if we are creating multiple or bookings
        return await prisma.$transaction(async (tx) => {
            let currentStart = start;

            while (isBefore(currentStart, end)) {
                const currentEnd = addMinutes(currentStart, SLOT_DURATION);

                // If the next slot would go beyond the end time, we stop (or we could truncate, but 45m policy is better)
                if (currentEnd > end && currentStart !== start) break;

                // Create Slot
                const slot = await tx.mentorshipSlot.create({
                    data: {
                        teacherId,
                        startTime: currentStart,
                        endTime: currentEnd > end ? end : currentEnd, // Allow the last one to be shorter if it's the ONLY one or requested
                        meetingUrl: meetingUrl || null,
                        isBooked: !!studentIds && studentIds.length > 0
                    }
                });

                // If direct booking
                if (studentIds && studentIds.length > 0 && projectId) {
                    // Generate Meet link if requested
                    let finalMeetingUrl = meetingUrl;
                    if (!meetingUrl) {
                        try {
                            const project = await tx.project.findUnique({
                                where: { id: projectId },
                                include: { students: true }
                            });

                            const attendees = [
                                ...project?.students.filter(s => ((studentIds as string[]) || []).includes(s.id)).map(s => s.email),
                                session.user.email
                            ].filter((e): e is string => !!e);

                            finalMeetingUrl = await generateMeetLinkWithEvent({
                                summary: `Mentoría Directa - ${project?.title || 'Asesoría'}`,
                                description: `Mentoría programada por el profesor.\n\nNotas: ${note || 'Sin notas'}`,
                                startTime: currentStart,
                                endTime: currentEnd,
                                attendees
                            });
                        } catch (e) {
                            console.error('Meet generation fail:', e);
                            finalMeetingUrl = generateMeetLink();
                        }
                    }

                    // Update slot with meet link if generated
                    await tx.mentorshipSlot.update({
                        where: { id: slot.id },
                        data: { meetingUrl: finalMeetingUrl }
                    });

                    // Create Booking
                    await (tx.mentorshipBooking as any).create({
                        data: {
                            slotId: slot.id,
                            projectId,
                            note: note || 'Sesión programada por profesor',
                            status: 'CONFIRMED',
                            initiatedBy: 'TEACHER',
                            students: {
                                connect: (studentIds as string[]).map((id: string) => ({ id }))
                            }
                        }
                    });
                }

                slotsCreated.push(slot);
                currentStart = currentEnd;

                // If it was a single fixed slot, break after one
                if (currentEnd >= end) break;
            }

            return NextResponse.json({ success: true, count: slotsCreated.length, slots: slotsCreated });
        });

    } catch (error: any) {
        console.error('Create slot error:', error);
        return NextResponse.json({ error: error.message || 'Error al crear disponibilidad' }, { status: 500 });
    }
}
