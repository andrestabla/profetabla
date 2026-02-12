// import { prisma } from '@/lib/prisma';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { SystemLogsViewer } from '../components/SystemLogsViewer';

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

    return (
        <div className="max-w-7xl mx-auto p-6">
            <AdminNav />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Logs de Actividad del Sistema</h2>
                <SystemLogsViewer />
            </div>
        </div>
    );
}
