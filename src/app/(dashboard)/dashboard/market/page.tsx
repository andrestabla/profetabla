import { prisma } from '@/lib/prisma';
import ProjectMarketClient from './ProjectMarketClient';

export const dynamic = 'force-dynamic';

// Define types
type ProjectType = 'PROJECT' | 'CHALLENGE' | 'PROBLEM';

export default async function Page({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    // Await params in Next.js 15+
    const params = await searchParams;
    const rawType = params?.type;
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
