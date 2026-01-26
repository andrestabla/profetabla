import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const slots = await prisma.mentorshipSlot.findMany({
            include: {
                teacher: true,
                booking: {
                    include: {
                        student: true,
                        project: { select: { title: true } }
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });
        return NextResponse.json(slots);
    } catch {
        return NextResponse.json({ error: 'Error fetching slots' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { startTime, endTime, meetingUrl } = body;

        // MVP: Mock teacher
        const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
        if (!teacher) return NextResponse.json({ error: 'No teacher found' }, { status: 404 });

        const slot = await prisma.mentorshipSlot.create({
            data: {
                teacherId: teacher.id,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                meetingUrl
            }
        });

        return NextResponse.json(slot);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating slot' }, { status: 500 });
    }
}
