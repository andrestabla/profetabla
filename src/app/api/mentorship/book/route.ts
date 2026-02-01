import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateMeetLink } from '@/lib/google-meet';

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
        const isProjectTeacher = await prisma.project.findFirst({
            where: {
                id: projectId,
                teachers: { some: { id: slot.teacherId } }
            }
        });

        if (!isProjectTeacher) {
            return NextResponse.json({ error: 'El profesor seleccionado no forma parte de este proyecto' }, { status: 403 });
        }

        // Student Booking Limit Logic: At least 3 tasks required
        if (session.user.role === 'STUDENT') {
            const taskCount = await prisma.task.count({ where: { projectId } });

            if (taskCount < 3) {
                return NextResponse.json({
                    error: `Debes tener al menos 3 tareas creadas en tu tablero Kanban para solicitar una mentoría (Actualmente: ${taskCount}).`
                }, { status: 400 });
            }
        }

        const studentIds = overtStudentIds || [session.user.id];
        const meetingUrl = generateMeetLink();

        const booking = await prisma.$transaction(async (tx) => {
            // Optimistic Update: Check isBooked
            const updateResult = await tx.mentorshipSlot.updateMany({
                where: { id: slotId, isBooked: false },
                data: {
                    isBooked: true,
                    meetingUrl,
                    version: { increment: 1 }
                }
            });

            if (updateResult.count === 0) throw new Error('SLOT_ALREADY_BOOKED');

            return await tx.mentorshipBooking.create({
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
    } // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (e: any) {
        console.error("Booking error:", e);
        return NextResponse.json({ error: e.message || 'Error booking slot' }, { status: 500 });
    }
}
