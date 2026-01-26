import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // TODO: Filter by current user/project session. For MVP grabbing first project.
        const project = await prisma.project.findFirst({
            include: {
                tasks: {
                    include: {
                        tags: true,
                        assignees: true,
                        comments: {
                            include: { user: true },
                            orderBy: { createdAt: 'desc' }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!project) {
            return NextResponse.json({ tasks: [] });
        }

        return NextResponse.json(project.tasks);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching tasks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, projectId, priority, dueDate, description } = body;

        // Fallback if no projectId provided (MVP hack)
        let pid = projectId;
        if (!pid) {
            const project = await prisma.project.findFirst();
            pid = project?.id;
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId: pid,
                status: 'TODO'
            }
        });
        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating task' }, { status: 500 });
    }
}
