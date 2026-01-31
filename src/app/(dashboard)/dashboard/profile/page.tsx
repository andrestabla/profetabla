import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfilePageClient from './ProfilePageClient';

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            bio: true,
            age: true,
            interests: true,
            avatarUrl: true,
            policiesAccepted: true,
            policiesAcceptedAt: true,
            workExperiences: { orderBy: { startDate: 'desc' } },
            education: { orderBy: { startDate: 'desc' } },
            languages: true
        }
    });

    if (!user) return <div>Usuario no encontrado</div>;

    return <ProfilePageClient user={user} />;
}
