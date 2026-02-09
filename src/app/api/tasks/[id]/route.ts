import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { title, description, status, priority, dueDate, maxDate, deliverable, allowedFileTypes, rubric, evaluationCriteria, quizData, isApproved, approvalNotes } = body;

        // Validate Status transition for Students
        const currentTask = await prisma.task.findUnique({ where: { id: id }, select: { status: true, isMandatory: true } });
        if (!currentTask) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        // Enforcement: Students cannot move (change status) or edit mandatory tasks
        if (session.user.role === 'STUDENT' && currentTask.isMandatory) {
            // However, we might want to allow students to mark a task as DONE if they finished it? 
            // The prompt says "no pueden editar ni eliminar". Moving is editing status. 
            // In many kanbans, students move tasks to done. 
            // BUT the instruction says "estudiantes no pueden editar ni eliminar tareas obligatorias".
            // So I will block ALL PATCH calls for students on mandatory tasks.
            return NextResponse.json({ error: 'No tienes permiso para modificar tareas obligatorias' }, { status: 403 });
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(priority && { priority }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(body.maxDate !== undefined && { maxDate: body.maxDate ? new Date(body.maxDate) : null }),
                ...(isApproved !== undefined && { isApproved }),
                ...(approvalNotes !== undefined && { approvalNotes }),
                ...(body.deliverable !== undefined && { deliverable: body.deliverable }),
                ...(body.allowedFileTypes !== undefined && { allowedFileTypes: body.allowedFileTypes }),
                ...(body.evaluationCriteria !== undefined && { evaluationCriteria: body.evaluationCriteria }),
                ...(body.rubric !== undefined && { rubric: body.rubric }),
            },
        });

        // Sync Assignment if the task HAS a deliverable
        const taskDeliverable = body.deliverable !== undefined ? body.deliverable : task.deliverable;

        if (taskDeliverable && typeof taskDeliverable === 'string' && taskDeliverable.trim().length > 0) {
            const assignment = await prisma.assignment.upsert({
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

            // Sync Rubric if provided
            if (body.rubric && Array.isArray(body.rubric)) {
                // Delete existing rubric items
                await prisma.rubricItem.deleteMany({
                    where: { assignmentId: assignment.id }
                });

                // Create new ones
                /* eslint-disable @typescript-eslint/no-explicit-any */
                await prisma.rubricItem.createMany({
                    data: body.rubric.map((item: any, index: number) => ({
                        assignmentId: assignment.id,
                        criterion: item.criterion || item.text || 'Criterio sin nombre',
                        maxPoints: item.points || item.maxPoints || 10, // Default to 10 if not specified
                        order: index
                    }))
                });
            }

        } else if (body.deliverable === '' || body.deliverable === null) {
            // If deliverable is explicitly cleared, delete the assignment
            await prisma.assignment.deleteMany({
                where: { taskId: id }
            });
        }

        return NextResponse.json(task);
    } catch (e) {
        console.error("Error updating task:", e);
        return NextResponse.json({ error: 'Error updating task' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !['ADMIN', 'PROFESSOR'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        if (session.user.role === 'STUDENT' && task.isMandatory) {
            return NextResponse.json({ error: 'No tienes permiso para eliminar tareas obligatorias' }, { status: 403 });
        }

        await prisma.task.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Error deleting task' },
            { status: 500 }
        );
    }
}
