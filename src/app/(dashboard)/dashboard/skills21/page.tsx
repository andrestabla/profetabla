import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Skills21Client from './Skills21Client';

export const dynamic = 'force-dynamic';

export default async function Skills21Page() {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const canManage = session.user.role === 'TEACHER' || session.user.role === 'ADMIN';

    const skills = await prisma.twentyFirstSkill.findMany({
        orderBy: [
            { industry: 'asc' },
            { name: 'asc' }
        ],
        include: {
            _count: {
                select: {
                    projects: true
                }
            }
        }
    });

    const safeSkills = skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        industry: skill.industry,
        category: skill.category,
        description: skill.description,
        trendSummary: skill.trendSummary,
        examples: skill.examples || [],
        tags: skill.tags || [],
        isActive: skill.isActive,
        sources: skill.sources ?? [],
        createdAt: skill.createdAt.toISOString(),
        updatedAt: skill.updatedAt.toISOString(),
        projectCount: skill._count.projects
    }));

    return (
        <Skills21Client
            skills={safeSkills}
            canManage={canManage}
            currentRole={session.user.role}
        />
    );
}

