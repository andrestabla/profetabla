import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { taskId, content, userId } = body;

        // MVP: If no userId, pick the first user (Teacher/Student based on context? Just randomly picking one for now to unblock)
        // Ideally this comes from session
        let uid = userId;
        if (!uid) {
            const user = await prisma.user.findFirst();
            uid = user?.id;
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                taskId,
                userId: uid,
            },
            include: {
                user: true,
            },
        });

        return NextResponse.json(comment);
    } catch (error) {
        return NextResponse.json(
            { error: 'Error creating comment' },
            { status: 500 }
        );
    }
}
