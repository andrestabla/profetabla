import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { slotId, note, projectId: overtProjectId } = body;

        // Find Active Project context if not provided
        let projectId = overtProjectId;
        if (!projectId && session.user.role === 'STUDENT') {
            const activeProject = await prisma.project.findFirst({
                where: {
                    studentId: session.user.id,
                    status: 'IN_PROGRESS'
                }
            });
            projectId = activeProject?.id;
        }

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const booking = await prisma.$transaction(async (tx: any) => {
            /* eslint-enable @typescript-eslint/no-explicit-any */
            // Optimistic Update: Check isBooked and version in a single atomic operation
            const updateResult = await tx.mentorshipSlot.updateMany({
                where: {
                    id: slotId,
                    isBooked: false
                },
                data: {
                    isBooked: true,
                    version: { increment: 1 }
                }
            });

            if (updateResult.count === 0) {
                throw new Error('SLOT_ALREADY_BOOKED');
            }

            const newBooking = await tx.mentorshipBooking.create({
                data: {
                    slotId,
                    studentId: session.user.id,
                    projectId,
                    note,
                    status: 'CONFIRMED'
                }
            });

            return newBooking;
        });

        return NextResponse.json(booking);
    } catch {
        return NextResponse.json({ error: 'Error booking slot' }, { status: 500 });
    }
}
