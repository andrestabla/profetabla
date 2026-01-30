import { prisma } from '@/lib/prisma';
import ProjectMarketClient from './ProjectMarketClient';

export const dynamic = 'force-dynamic';

// Define types
type ProjectType = 'PROJECT' | 'CHALLENGE' | 'PROBLEM';

export default async function Page({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    // Extract type from params (safe cast)
    const rawType = searchParams?.type;
    const typeStr = Array.isArray(rawType) ? rawType[0] : rawType;
    let filterType: ProjectType | undefined;

    if (typeStr === 'PROJECT' || typeStr === 'CHALLENGE' || typeStr === 'PROBLEM') {
        filterType = typeStr;
    }

    const availableProjects = await prisma.project.findMany({
        where: {
            status: 'OPEN',
            ...(filterType ? { type: filterType } : {})
        },
        include: {
            teacher: {
                select: {
                    name: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return <ProjectMarketClient availableProjects={availableProjects} currentFilter={filterType} />;
}
