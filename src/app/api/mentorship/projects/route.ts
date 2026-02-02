import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = session.user.role;

        if (role !== 'TEACHER' && role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Admins see all projects, Teachers see only their projects
        const projects = await prisma.project.findMany({
            where: role === 'ADMIN' ? {} : {
                teachers: { some: { id: session.user.id } }
            },
            select: {
                id: true,
                title: true,
                students: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error('Mentorship projects API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch projects for mentorship' },
            { status: 500 }
        );
    }
}
