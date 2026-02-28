import { Sidebar } from '@/components/Sidebar';
import { MobileNavbar } from '@/components/MobileNavbar';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PoliciesModal from '@/components/PoliciesModal';
import { SupportBubble } from '@/components/SupportBubble';
import { ActivityTracker } from '@/components/ActivityTracker';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Auth & Fetch User + Config
    const session = await getServerSession(authOptions);
    const [config, user] = await Promise.all([
        prisma.platformConfig.findUnique({ where: { id: 'global-config' } }),
        session?.user?.id
            ? prisma.user.findUnique({ where: { id: session.user.id }, select: { policiesAccepted: true } })
            : null
    ]);

    return (
        <div className="flex flex-col lg:flex-row bg-slate-50 min-h-screen font-sans">
            {/* Si el usuario NO ha aceptado las políticas, mostramos el modal forzado */}
            {session && user && !user.policiesAccepted && (
                <PoliciesModal />
            )}

            <MobileNavbar config={config} />
            <Sidebar config={config} />
            <ActivityTracker />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
            <SupportBubble />
        </div>
    );
}
