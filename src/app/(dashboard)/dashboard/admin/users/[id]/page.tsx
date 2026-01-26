import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { toggleUserStatusAction, deleteUserAction, updateUserRoleAction, sendMessageAction, resetPasswordAction } from '../../actions';
import { ArrowLeft, Shield, Clock, Mail, Key, Trash2, Ban, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import UserActionsClient from './UserActionsClient'; // Client logic for modals/interactions

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            activityLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
            _count: {
                select: { createdLearningObjects: true, comments: true }
            }
        }
    });

    if (!user) return notFound();

    return (
        <div className="max-w-6xl mx-auto p-6">
            <Link href="/dashboard/admin/users" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver a la Lista
            </Link>

            {/* HEADER PERFIL */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-slate-500">
                    {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full" /> : user.name?.[0]?.toUpperCase()}
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
                                                    {log.metadata}
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
