import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!projectId) {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { isGroup: true }
        });

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        // If isGroup is FALSE (Individual), strictly filter tasks assigned to the current user
        // If isGroup is TRUE (Group), show all tasks for the project
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const whereClause: any = {
            projectId
        };

        if (!project.isGroup) {
            whereClause.assignees = { some: { id: session.user.id } };
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: { comments: true, tags: true, assignees: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(tasks);
    } catch {
        return NextResponse.json({ error: 'Error fetching tasks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, priority, dueDate, projectId, status, deliverable, evaluationCriteria } = body;

        let pid = projectId;
        if (!pid) {
            // For MVP, if user doesn't pass project ID, try to find one assigned to them
            const proj = await prisma.project.findFirst({
                where: {
                    students: { some: { id: session.user.id } },
                    status: 'IN_PROGRESS'
                }
            });
            pid = proj?.id;
        }

        if (!pid) return NextResponse.json({ error: 'Project ID required' }, { status: 400 });

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority,
                ...(dueDate && { dueDate: new Date(dueDate) }),
                projectId: pid,
                status: status || 'TODO',
                deliverable,
                evaluationCriteria,
                // Automatically assign the creator to the task
                assignees: {
                    connect: { id: session.user.id }
                },
                // If there is a deliverable, create the linked Assignment immediately
                ...(deliverable ? {
                    assignment: {
                        create: {
                            title: `Entrega: ${title}`,
                            projectId: pid,
                            dueDate: dueDate ? new Date(dueDate) : undefined,
                            evaluationCriteria: evaluationCriteria,
                            description: `Entrega asociada a la tarea: ${title}. ${description || ''}`
                        }
                    }
                } : {})
            }
        });

        await logActivity(session.user.id, 'CREATE_TASK', `Creó la tarea: "${title}"`);

        return NextResponse.json(task);
    } catch {
        return NextResponse.json({ error: 'Error creating task' }, { status: 500 });
    }
}
