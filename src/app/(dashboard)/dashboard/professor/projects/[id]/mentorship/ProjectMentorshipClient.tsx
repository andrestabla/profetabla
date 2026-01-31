'use client';

import { useState } from 'react';
import { Calendar, AlertTriangle, CheckCircle2, UserPlus, Clock } from 'lucide-react';
import { summonStudentAction } from './actions';

type Booking = {
    id: string;
    slot: { startTime: Date };
    status: string;
    initiatedBy: string;
}

type ProjectSimple = {
    id: string;
    students: { id: string }[];
};

export default function ProjectMentorshipClient({ project, riskLevel, upcomingSessions }: { project: ProjectSimple, riskLevel: 'HIGH' | 'NORMAL', upcomingSessions: Booking[] }) {
    const [isSummoning, setIsSummoning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">

            {/* 1. TARJETA DE DIAGNÓSTICO (El disparador) */}
            <div className={`p-6 rounded-xl border ${riskLevel === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className={`p-3 rounded-full ${riskLevel === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {riskLevel === 'HIGH' ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Estado del Estudiante: {riskLevel === 'HIGH' ? 'En Riesgo' : 'Normal'}</h2>
                            <p className="text-slate-600 mt-1 max-w-xl">
                                {riskLevel === 'HIGH'
                                    ? "El estudiante tiene un retraso del 40% en los contenidos."
                                    : "El estudiante avanza según el cronograma esperado."}
                            </p>
                        </div>
                    </div>

                    {/* EL BOTÓN MÁGICO DE INTERVENCIÓN */}
                    {riskLevel === 'HIGH' && (
                        <button
                            onClick={() => setIsSummoning(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-red-500/30 flex items-center gap-2 animate-pulse transition-all"
                        >
                            <UserPlus className="w-5 h-5" /> Citar a Mentoría Urgente
                        </button>
                    )}
                </div>
            </div>

            {/* 2. LISTA DE SESIONES AGENDADAS */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> Próximas Sesiones del Proyecto
                </h3>
                <div className="space-y-3">
                    {upcomingSessions.length === 0 ? (
                        <p className="text-slate-500">No hay sesiones agendadas.</p>
                    ) : upcomingSessions.map(session => (
                        <div key={session.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-center px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-xs text-slate-500 font-bold uppercase">{new Date(session.slot.startTime).toLocaleString('es', { month: 'short' })}</p>
                                    <p className="text-xl font-bold text-slate-800">{new Date(session.slot.startTime).getDate()}</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{session.initiatedBy === 'TEACHER' ? '🔴 Citación de Seguimiento' : '🔵 Mentoría Regular'}</h4>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(session.slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${session.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {session.status === 'CONFIRMED' ? 'Confirmada' : 'Pendiente'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL PARA CITAR (Simplificado) */}
            {isSummoning && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Citar a Mentoría Urgente</h2>
                        <p className="text-sm text-slate-600 mb-4">Se agendará automáticamente una sesión para mañana a las 10:00 AM y se notificará al estudiante.</p>
                        <form action={async (fd) => {
                            setIsProcessing(true);
                            await summonStudentAction(fd);
                            setIsSummoning(false);
                            setIsProcessing(false);
                        }}>
                            <input type="hidden" name="projectId" value={project.id} />
                            <input type="hidden" name="studentId" value={project.students[0]?.id} />
                            <input type="hidden" name="reason" value="Bajo rendimiento en el proyecto" />

                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setIsSummoning(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                <button disabled={isProcessing} type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50">
                                    {isProcessing ? 'Procesando...' : 'Confirmar Citación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
