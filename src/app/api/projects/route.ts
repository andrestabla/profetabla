import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, industry, justification, objectives, deliverables } = body;

        const project = await prisma.project.create({
            data: {
                title,
                description,
                industry,
                justification,
                objectives,
                deliverables,
                status: 'OPEN',
                teachers: { connect: { id: session.user.id } }
            }
        });

        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating project' }, { status: 500 });
    }
}
