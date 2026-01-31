
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { TeamManagement } from '@/components/TeamManagement';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function StudentTeamsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            teams: {
                include: {
                    members: {
                        select: { id: true, name: true, avatarUrl: true }
                    }
                },
                orderBy: { createdAt: 'asc' }
            },
            students: {
                where: { id: session.user.id }
            },
            teachers: {
                select: { id: true } // Just to check permission if needed, though simple enrollment check is enough
            }
        }
    });

    if (!project) return notFound();

    // Verify student is enrolled (or is teacher/admin)
    const isEnrolled = project.students.length > 0;
    const isTeacher = project.teachers.some(t => t.id === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isEnrolled && !isTeacher && !isAdmin) {
        redirect('/dashboard');
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4 text-sm font-bold"
                >
                    <ChevronLeft className="w-4 h-4" /> Volver al Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Gestión de Equipos</h1>
                <p className="text-slate-500">
                    Proyecto: <span className="font-bold text-slate-800">{project.title}</span>
                </p>
                <p className="text-sm text-slate-500 mt-2">
                    Únete a un equipo existente o crea uno nuevo para colaborar con tus compañeros.
                </p>
            </div>

            <TeamManagement
                teams={project.teams}
                projectId={project.id}
                 
                // @ts-expect-error session user type mismatch
                currentUser={session.user}
                projectType={project.type}
            />
        </div>
    );
}
