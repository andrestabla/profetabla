import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from 'next/navigation';
import { TeamManagement } from '@/components/TeamManagement';
import { getProjectRoute } from '@/lib/routes';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function TeamsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) redirect('/login');

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            teams: {
                include: { members: true },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!project) return notFound();

    // Only allow if project is groupal? Or always allow to enable mixed? 
    // The user said essentially "when marked as group project".

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <Link
                href={getProjectRoute(project.id, project.type)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 w-fit"
            >
                <ArrowLeft className="w-4 h-4" /> Volver al Proyecto
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{project.title}</h1>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase">
                        {project.isGroup ? 'Proyecto Grupal' : 'Individual / Mixto'}
                    </span>
                </div>
            </div>

            <TeamManagement
                teams={project.teams}
                projectId={project.id}
                currentUser={session.user}
                projectType={project.type}
            />
        </div>
    );
}
