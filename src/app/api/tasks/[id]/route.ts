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
        const { status, title, description, priority, dueDate, isApproved, approvalNotes } = body;

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(priority && { priority }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(isApproved !== undefined && { isApproved }),
                ...(approvalNotes !== undefined && { approvalNotes }),
                ...(body.deliverable !== undefined && { deliverable: body.deliverable }),
                ...(body.evaluationCriteria !== undefined && { evaluationCriteria: body.evaluationCriteria }),
            },
        });

        // Sync Assignment if deliverable is set
        if (body.deliverable && typeof body.deliverable === 'string' && body.deliverable.trim().length > 0) {
            await prisma.assignment.upsert({
                where: { taskId: id },
                create: {
                    title: `Entrega: ${task.title}`,
                    description: `Entrega asociada a la tarea: ${task.title}. ${task.description || ''}`,
                    projectId: task.projectId,
                    taskId: id,
                    dueDate: task.dueDate,
                    evaluationCriteria: task.evaluationCriteria
                },
                update: {
                    title: `Entrega: ${task.title}`,
                    dueDate: task.dueDate,
                    evaluationCriteria: task.evaluationCriteria,
                    description: `Entrega asociada a la tarea: ${task.title}. ${task.description || ''}`,
                }
            });
        } else if (body.deliverable === '' || body.deliverable === null) {
            // If deliverable is explicitly cleared, delete the assignment
            await prisma.assignment.deleteMany({
                where: { taskId: id }
            });
        }

        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json(
            { error: 'Error updating task' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.task.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Error deleting task' },
            { status: 500 }
        );
    }
}
