import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StudentRecognitionsClient } from './StudentRecognitionsClient';

export const dynamic = 'force-dynamic';

export default async function StudentRecognitionsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect('/login');
    if (session.user.role !== 'STUDENT') redirect('/dashboard');

    const recognitionAwards = await prisma.recognitionAward.findMany({
        where: {
            studentId: session.user.id
        },
        include: {
            recognitionConfig: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    type: true
                }
            },
            project: {
                select: {
                    id: true,
                    title: true,
                    type: true
                }
            }
        },
        orderBy: { awardedAt: 'desc' },
        take: 100
    });

    const safeAwards = recognitionAwards.map((award) => ({
        id: award.id,
        verificationCode: award.verificationCode,
        isRevoked: award.isRevoked,
        revokedReason: award.revokedReason,
        awardedAt: award.awardedAt.toISOString(),
        recognitionConfig: award.recognitionConfig,
        project: award.project
    }));

    return <StudentRecognitionsClient recognitionAwards={safeAwards} />;
}
