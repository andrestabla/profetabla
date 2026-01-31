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

    const rawProjects = await prisma.project.findMany({
        where: {
            status: 'OPEN',
            ...(filterType ? { type: filterType } : {})
        },
        include: {
            teachers: {
                select: {
                    name: true,
                    avatarUrl: true
                }
            },
            students: {
                select: { id: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const availableProjects = rawProjects.filter(project => {
        const now = new Date();
        const hasSpace = !project.maxStudents || project.students.length < project.maxStudents;
        const isStarted = !project.startDate || project.startDate <= now;
        const isNotEnded = !project.endDate || project.endDate >= now;

        return hasSpace && isStarted && isNotEnded;
    });

    // Remove filtered properties before passing to client component to match its type if necessary
    // or update the client component type. The client expects ProjectWithTeacher.
    // We can cast or just pass as is, since extra props (students, dates) are fine.

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <ProjectMarketClient availableProjects={availableProjects as any} currentFilter={filterType} />;
}
