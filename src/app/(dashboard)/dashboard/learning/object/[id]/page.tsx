import { prisma } from '@/lib/prisma';
import StudentViewerClient from './StudentViewerClient';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const learningObject = await prisma.learningObject.findUnique({
        where: { id },
        include: {
            items: {
                orderBy: { order: 'asc' },
                include: {
                    interactions: {
                        where: { userId: session?.user?.id }
                    }
                }
            },
            comments: {
                include: { author: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!learningObject) return notFound();

    // Transform interactions for client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const learningObjectWithInteractions = {
        ...learningObject,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interactions: learningObject.items.flatMap((i: any) => i.interactions.map((x: any) => ({ resourceItemId: x.resourceItemId, isCompleted: x.isCompleted })))
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <StudentViewerClient
        learningObject={learningObjectWithInteractions as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        comments={learningObject.comments as any}
        currentUserId={session?.user?.id}
        currentUserRole={session?.user?.role}
    />;
}
