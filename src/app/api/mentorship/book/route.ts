import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { slotId, note } = body;

        // MVP: Mock student
        const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
        if (!student) return NextResponse.json({ error: 'No student found' }, { status: 404 });

        // Transaction: Create booking and mark slot as booked
        const booking = await prisma.$transaction(async (tx) => {
            const newBooking = await tx.mentorshipBooking.create({
                data: {
                    slotId,
                    studentId: student.id,
                    note,
                    status: 'CONFIRMED'
                }
            });

            await tx.mentorshipSlot.update({
                where: { id: slotId },
                data: { isBooked: true }
            });

            return newBooking;
        });

        return NextResponse.json(booking);
    } catch (error) {
        return NextResponse.json({ error: 'Error booking slot' }, { status: 500 });
    }
}
