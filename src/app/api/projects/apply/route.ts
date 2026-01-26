import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { projectId, motivation } = await request.json();

        const application = await prisma.projectApplication.create({
            data: {
                projectId,
                studentId: session.user.id,
                motivation,
                status: 'PENDING'
            }
        });

        return NextResponse.json(application);
    } catch (error) {
        return NextResponse.json({ error: 'Error applying to project' }, { status: 500 });
    }
}
