'use client';

import { useState, useEffect } from 'react';
import { Loader2, UserCheck, Check, X, FileText } from 'lucide-react';
import StatusModal from '@/components/StatusModal';

interface ApplicationData {
    id: string;
    student: { name: string; email: string };
    project: { title: string };
    motivation: string;
}

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<ApplicationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'warning';
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    const fetchApps = () => {
        fetch('/api/projects/applications')
            .then(res => res.json())
            .then(data => {
                setApplications(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchApps();
    }, []);

    const handleAction = async (id: string, action: 'ACCEPT' | 'REJECT') => {
        setProcessingId(id);
        try {
            const res = await fetch('/api/projects/applications', {
                method: 'POST',
                body: JSON.stringify({ applicationId: id, action }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                const app = applications.find(a => a.id === id);
                setModalConfig({
                    isOpen: true,
                    type: action === 'ACCEPT' ? 'success' : 'warning',
                    title: action === 'ACCEPT' ? '¡Estudiante Aceptado!' : 'Solicitud Rechazada',
                    message: action === 'ACCEPT'
                        ? `${app?.student?.name} ha sido aceptado en ${app?.project?.title}.`
                        : `Has rechazado la solicitud de ${app?.student?.name}.`
                });
            } else {
                throw new Error('Failed');
            }
        } catch {
            setModalConfig({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo procesar la solicitud en este momento.'
            });
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div>
            <StatusModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
            />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-8 h-8 text-orange-600" />
                    Solicitudes de Ingreso
                </h1>
                <p className="text-slate-500">Estudiantes que quieren unirse a tus proyectos.</p>
            </div>

            <div className="space-y-4">
                {applications.map((app) => (
                    <div key={app.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{app.student.name}</h3>
                                    <p className="text-sm text-slate-500 mb-2">Aplica para: <span className="font-semibold text-blue-600">{app.project.title}</span></p>
                                </div>
                                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-bold">Pendiente</span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg mt-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-1">
                                    <FileText className="w-3 h-3" /> Carta de Motivación
                                </div>
                                <p className="text-slate-700 text-sm italic">&quot;{app.motivation}&quot;</p>
                            </div>
                        </div>

                        <div className="flex md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                            <button
                                disabled={!!processingId}
                                onClick={() => handleAction(app.id, 'ACCEPT')}
                                className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" /> Aceptar
                            </button>
                            <button
                                disabled={!!processingId}
                                onClick={() => handleAction(app.id, 'REJECT')}
                                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                                <X className="w-4 h-4" /> Rechazar
                            </button>
                        </div>
                    </div>
                ))}

                {applications.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No hay solicitudes pendientes.
                    </div>
                )}
            </div>
        </div>
    );
}
