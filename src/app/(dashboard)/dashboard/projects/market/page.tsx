import { prisma } from '@/lib/prisma';
import ProjectMarketClient from './ProjectMarketClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const availableProjects = await prisma.project.findMany({
        where: {
            status: 'OPEN'
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

    return <ProjectMarketClient availableProjects={availableProjects} />;
}
