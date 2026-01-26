import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [
            usersCount,
            projectsCount,
            resourcesCount,
            submissionsCount
        ] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.resource.count(),
            prisma.submission.count()
        ]);

        return NextResponse.json({
            users: usersCount,
            projects: projectsCount,
            resources: resourcesCount,
            submissions: submissionsCount
        });
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching admin stats' }, { status: 500 });
    }
}
