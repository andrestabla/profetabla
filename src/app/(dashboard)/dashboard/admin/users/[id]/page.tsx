import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { toggleUserStatusAction, deleteUserAction, updateUserRoleAction, sendMessageAction, resetPasswordAction } from '../../actions';
import { ArrowLeft, Shield, Clock, Ban, CheckCircle, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import UserActionsClient from './UserActionsClient'; // Client logic for modals/interactions

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
            _count: {
                select: {
                    createdLearningObjects: true,
                    comments: true,
                    submissions: true,
                    assignedTasks: true
                }
            },
            // Projects as student
            projectsAsStudent: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    isGroup: true,
                    startDate: true,
                    endDate: true,
                    status: true,
                    teams: {
                        where: {
                            members: { some: { id } }
                        },
                        select: {
                            id: true
                        }
                    },
                    _count: {
                        select: { assignments: true }
                    }
                }
            },
            // Projects as teacher
            projectsAsTeacher: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    startDate: true,
                    endDate: true,
                    status: true
                }
            },

            // Submissions for grade tracking
            submissions: {
                select: {
                    id: true,
                    grade: true,
                    assignment: {
                        select: {
                            id: true,
                            title: true,
                            projectId: true
                        }
                    }
                }
            }
        }
    });

    if (!user) return notFound();

    // Fetch student's assignments for progress calculation
    const userProjectIds = user.projectsAsStudent.map(p => p.id);
    const studentTeamIds = user.projectsAsStudent.flatMap(p => p.teams.map(t => t.id));

    // Fetch all assignments for user's projects
    const projectAssignments = await prisma.assignment.findMany({
        where: {
            projectId: { in: userProjectIds }
        },
        include: {
            submissions: {
                where: {
                    OR: [
                        { studentId: user.id },
                        { teamId: { in: studentTeamIds } }
                    ]
                }
            }
        }
    });

    // Group assignments by project and calculate stats
    const assignmentsByProject = projectAssignments.reduce((acc, assignment) => {
        if (!acc[assignment.projectId]) {
            acc[assignment.projectId] = { total: 0, completed: 0 };
        }
        acc[assignment.projectId].total++;
        if (assignment.submissions.length > 0) {
            acc[assignment.projectId].completed++;
        }
        return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    // Helper function to calculate project progress
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calculateProjectProgress = (project: any) => {
        const stats = assignmentsByProject[project.id] || { total: 0, completed: 0 };

        if (stats.total === 0) {
            return { percentage: 0, completed: 0, total: 0 };
        }

        return {
            percentage: Math.round((stats.completed / stats.total) * 100),
            completed: stats.completed,
            total: stats.total
        };
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <Link href="/dashboard/admin/users" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver a la Lista
            </Link>

            {/* HEADER PERFIL */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-slate-500">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name || 'Avatar'} className="w-full h-full rounded-full" /> : user.name?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">{user.name}</h1>
                    <p className="text-slate-500 mb-4">{user.email}</p>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2">
                            <Shield className="w-4 h-4" /> {user.role}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.isActive ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            {user.isActive ? 'ACTIVO' : 'SUSPENDIDO'}
                        </span>
                    </div>
                </div>

                <div className="w-full md:w-auto p-4 bg-slate-50 rounded-xl border border-slate-100 min-w-[200px]">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Estadísticas</h3>
                    <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between">
                            <span>OAs Creados:</span> <span className="font-bold text-slate-900">{user._count.createdLearningObjects}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Comentarios:</span> <span className="font-bold text-slate-900">{user._count.comments}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* PROJECT PARTICIPATION */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-purple-600" />
                    Proyectos y Retos
                </h3>

                {/* As Student */}
                {user.projectsAsStudent.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-slate-600 mb-3">
                            Como Estudiante ({user.projectsAsStudent.length})
                        </h4>
                        <div className="space-y-3">
                            {user.projectsAsStudent.map(project => {
                                const progress = calculateProjectProgress(project);

                                return (
                                    <div key={project.id}
                                        className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-purple-300 transition">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <Link href={`/dashboard/projects/${project.id}`}
                                                    className="font-semibold text-slate-800 hover:text-purple-600 transition">
                                                    {project.title}
                                                </Link>
                                                <div className="flex gap-2 mt-1 flex-wrap">
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                                        {project.type}
                                                    </span>
                                                    {project.status && (
                                                        <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs">
                                                            {project.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className="text-2xl font-bold text-purple-600">
                                                    {progress.percentage}%
                                                </div>
                                                <div className="text-xs text-slate-500">progreso</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${progress.percentage}%` }}>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex gap-4 mt-3 text-xs text-slate-600">
                                            <span>📝 {project._count.assignments || 0} asignaciones</span>
                                            <span>✅ {progress.completed}/{progress.total} tareas completadas</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* As Teacher */}
                {user.projectsAsTeacher.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-slate-600 mb-3">
                            Como Profesor ({user.projectsAsTeacher.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {user.projectsAsTeacher.map(project => (
                                <Link key={project.id}
                                    href={`/dashboard/projects/${project.id}`}
                                    className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-sm transition group">
                                    <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
                                        {project.title}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-600">{project.type}</span>
                                        {project.status && (
                                            <span className="text-xs text-slate-500">• {project.status}</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* No projects */}
                {user.projectsAsStudent.length === 0 && user.projectsAsTeacher.length === 0 && (
                    <p className="text-center text-slate-400 py-8">
                        No participa en ningún proyecto actualmente
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLUMNA IZQUIERDA: Acciones */}
                <div className="space-y-6">
                    <UserActionsClient user={user}
                        toggleAction={toggleUserStatusAction}
                        deleteAction={deleteUserAction}
                        roleAction={updateUserRoleAction}
                        msgAction={sendMessageAction}
                        resetAction={resetPasswordAction}
                    />
                </div>

                {/* COLUMNA DERECHA: Logs */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-600" /> Historial de Actividad
                        </h3>

                        <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
                            {user.activityLogs.length === 0 ? (
                                <p className="text-center text-slate-400 py-4">Sin actividad registrada.</p>
                            ) : (
                                user.activityLogs.map((log) => (
                                    <div key={log.id} className="relative pl-10">
                                        <div className={`absolute left-0 top-0 w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold z-10
                                            ${log.level === 'CRITICAL' ? 'bg-red-500 text-white' :
                                                log.level === 'WARNING' ? 'bg-amber-400 text-white' : 'bg-blue-500 text-white'}
                                        `}>
                                            {log.level[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{log.action}</p>
                                            <p className="text-xs text-slate-500 mb-1">{log.description}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </p>
                                            {log.metadata && (
                                                <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 font-mono break-all">
                                                    {typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
