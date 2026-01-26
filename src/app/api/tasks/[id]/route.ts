import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, title } = body;

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(title && { title }),
            },
        });

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
