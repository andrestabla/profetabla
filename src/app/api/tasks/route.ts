import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

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

        // Log Activity
        // MVP: Assuming fallback PID is valid and we have a user context (skipping user fetch for speed, using hardcoded/implicit logic or fetch if needed).
        // Since we don't have the user ID easily in the POST body usually (unless passed), we might need to fetch it or rely on what passed.
        // For MVP demo, let's fetch the student associated with the project if possible, or just skip if complex.
        // Actually, let's fetch the project to get the studentId.
        const proj = await prisma.project.findUnique({ where: { id: pid } });
        if (proj) {
            await logActivity(proj.studentId, 'CREATE_TASK', `Creó la tarea: "${title}"`);
        }

        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating task' }, { status: 500 });
    }
}
