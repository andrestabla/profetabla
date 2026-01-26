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
        include: {
            workExperiences: { orderBy: { startDate: 'desc' } },
            education: { orderBy: { startDate: 'desc' } },
            languages: true
        }
    });

    if (!user) return <div>Usuario no encontrado</div>;

    return <ProfilePageClient user={user} />;
}
