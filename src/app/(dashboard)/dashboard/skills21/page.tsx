import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Skills21Client from './Skills21Client';

export const dynamic = 'force-dynamic';

export default async function Skills21Page() {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');

    const canManageSkills = session.user.role === 'TEACHER' || session.user.role === 'ADMIN';
    const canUploadOccupations = session.user.role === 'ADMIN';

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
        sourceProvider: skill.sourceProvider,
        sourceUri: skill.sourceUri,
        sourceLanguage: skill.sourceLanguage,
        sourceLastSyncedAt: skill.sourceLastSyncedAt ? skill.sourceLastSyncedAt.toISOString() : null,
        createdAt: skill.createdAt.toISOString(),
        updatedAt: skill.updatedAt.toISOString(),
        projectCount: skill._count.projects
    }));

    const occupations = await prisma.occupation.findMany({
        orderBy: [
            { updatedAt: 'desc' },
            { occupationTitle: 'asc' }
        ],
        take: 1000,
        include: {
            forecasts: {
                orderBy: { year: 'asc' }
            },
            skills: {
                select: {
                    id: true,
                    name: true,
                    industry: true,
                    category: true
                },
                orderBy: [
                    { industry: 'asc' },
                    { name: 'asc' }
                ]
            }
        }
    });

    const occupationTotal = await prisma.occupation.count();

    const safeOccupations = occupations.map((occupation) => ({
        id: occupation.id,
        dataSource: occupation.dataSource,
        geography: occupation.geography,
        industryCode: occupation.industryCode,
        occupationCode: occupation.occupationCode,
        occupationTitle: occupation.occupationTitle,
        occupationType: occupation.occupationType,
        qualificationLevel: occupation.qualificationLevel,
        isActive: occupation.isActive,
        createdAt: occupation.createdAt.toISOString(),
        updatedAt: occupation.updatedAt.toISOString(),
        forecasts: occupation.forecasts.map((forecast) => ({
            year: forecast.year,
            employmentCount: forecast.employmentCount,
            percentOfIndustry: forecast.percentOfIndustry,
            percentOfOccupation: forecast.percentOfOccupation
        })),
        skills: occupation.skills
    }));

    return (
        <Skills21Client
            skills={safeSkills}
            occupations={safeOccupations}
            occupationTotal={occupationTotal}
            canManageSkills={canManageSkills}
            canUploadOccupations={canUploadOccupations}
            currentRole={session.user.role}
        />
    );
}
