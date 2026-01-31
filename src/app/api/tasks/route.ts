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
            include: {
                teachers: { select: { id: true } }
            }
        });

        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        // Check if user is a teacher of this project or ADMIN
        const isTeacher = project.teachers.some(t => t.id === session.user.id) || session.user.role === 'ADMIN';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let whereClause: any = {
            projectId
        };

        if (!isTeacher) {
            // Student Logic
            // 1. Check if student belongs to a team in this project
            const userTeam = await prisma.team.findFirst({
                where: {
                    projectId,
                    members: { some: { id: session.user.id } }
                }
            });

            if (userTeam) {
                // If in a team, see tasks for that team OR tasks assigned specifically to them (hybrid)
                whereClause = {
                    projectId,
                    OR: [
                        { teamId: userTeam.id },
                        { assignees: { some: { id: session.user.id } } }
                    ]
                };
            } else {
                // If individual, only see their own tasks
                whereClause.assignees = { some: { id: session.user.id } };
            }
        }

        const tasks = await prisma.task.findMany({
            where: whereClause,
            include: { comments: true, tags: true, assignees: true, team: true },
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

        // Check for Team association
        const userTeam = await prisma.team.findFirst({
            where: {
                projectId: pid,
                members: { some: { id: session.user.id } }
            }
        });

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
                // Assign to Team if exists
                ...(userTeam ? {
                    team: { connect: { id: userTeam.id } }
                } : {}),
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
                            description: `Entrega asociada a la tarea: ${title}. ${description || ''}`,
                            // Also link Assignment to Team if applicable? 
                            // Only if Submission logic uses it. For now, Assignment is usually Project-wide or Task-specific. 
                            // The Schema has `teamId` on Submission, not Assignment (usually). 
                            // Wait, Schema check: Assignment usually doesn't have teamId unless edits were made. 
                            // Just keeping standard assignment creation for now.
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
