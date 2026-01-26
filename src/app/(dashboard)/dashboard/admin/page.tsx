import { prisma } from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    const [users, config, logs] = await Promise.all([
        prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
        prisma.platformConfig.findUnique({ where: { id: 'global-config' } }),
        prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { user: true } })
    ]);

    return <AdminDashboardClient users={users} config={config} logs={logs} />;
}
