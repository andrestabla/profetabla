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
        const { slotId, note } = body;

        const booking = await prisma.$transaction(async (tx) => {
            const newBooking = await tx.mentorshipBooking.create({
                data: {
                    slotId,
                    studentId: session.user.id,
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
