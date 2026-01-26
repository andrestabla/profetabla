import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { minutes, agreements } = body;

        const booking = await prisma.mentorshipBooking.update({
            where: { id },
            data: {
                minutes,
                agreements
            }
        });

        return NextResponse.json(booking);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating minutes' }, { status: 500 });
    }
}
