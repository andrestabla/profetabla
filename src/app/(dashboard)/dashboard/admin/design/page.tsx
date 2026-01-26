import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/AdminNav';
import { DesignEditor } from './DesignEditor';

export const dynamic = 'force-dynamic';

export default async function AdminDesignPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') redirect('/dashboard');

    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

    return (
        <div className="max-w-7xl mx-auto p-6">
            <AdminNav />
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Diseño y Personalización</h2>
                <p className="text-slate-500">Define la identidad visual de la plataforma.</p>
            </div>

            <DesignEditor config={config} />
        </div>
    );
}
