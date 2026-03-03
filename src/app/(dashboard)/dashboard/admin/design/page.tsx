import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Diseño y Personalización</h2>
                    <p className="text-slate-500">Define la identidad visual de la plataforma.</p>
                </div>
                <Link
                    href="/?edit=1"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
                >
                    Editar home
                </Link>
            </div>

            <DesignEditor config={config} />
        </div>
    );
}
