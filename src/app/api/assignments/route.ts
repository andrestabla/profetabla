import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, dueDate, projectId } = body;

        // MVP Hack: If no projectId, grab the first one
        let pid = projectId;
        if (!pid) {
            const project = await prisma.project.findFirst();
            pid = project?.id;
        }

        if (!pid) {
            return NextResponse.json({ error: 'No projects available' }, { status: 400 });
        }

        const assignment = await prisma.assignment.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate),
                projectId: pid
            }
        });

        return NextResponse.json(assignment);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating assignment' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const assignments = await prisma.assignment.findMany({
            include: {
                submissions: {
                    select: { id: true, studentId: true, grade: true }
                }
            },
            orderBy: { dueDate: 'asc' }
        });
        return NextResponse.json(assignments);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching assignments' }, { status: 500 });
    }
}
