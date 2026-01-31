import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const projects = await prisma.project.findMany({
            where: {
                status: 'OPEN'
            },
            include: {
                teachers: {
                    select: { name: true, avatarUrl: true }
                },
                tags: true
            }
        });

        return NextResponse.json(projects);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching projects' }, { status: 500 });
    }
}
