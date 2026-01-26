import { prisma } from '@/lib/prisma';
import StudentViewerClient from './StudentViewerClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const learningObject = await prisma.learningObject.findUnique({
        where: { id },
        include: {
            items: true
        }
    });

    if (!learningObject) return notFound();

    return <StudentViewerClient learningObject={learningObject as any} />;
}
