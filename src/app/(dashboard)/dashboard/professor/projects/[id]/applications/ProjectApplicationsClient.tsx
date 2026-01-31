'use client';

import { useState } from 'react';
import { User, CheckCircle2, XCircle, FileText, Calendar, ArrowRight } from 'lucide-react';
import { acceptStudentActionV2, rejectStudentAction } from '@/app/actions/project-actions';
import StatusModal from '@/components/StatusModal';
import { useRouter } from 'next/navigation';

// Tipado de la postulación
type Application = {
    id: string;
    motivation: string | null;
    createdAt: Date;
    student: { id: string; name: string | null; email: string; avatarUrl: string | null };
};

export default function ProjectApplicationsClient({
    projectTitle,
    projectId,
    applications
}: {
    projectTitle: string,
    projectId: string,
    applications: Application[]
}) {
    const router = useRouter();
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

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

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        router.refresh(); // Actualiza la lista para quitar al estudiante procesado
        if (applications.length <= 1) {
            setSelectedApp(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <StatusModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
            />
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Candidatos del Proyecto</h1>
                <p className="text-slate-500 font-medium mt-1">Proyecto: <span className="text-blue-600">{projectTitle}</span></p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna Izquierda: Lista de Candidatos */}
                <div className="md:col-span-1 space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        {applications.length} Postulaciones Pendientes
                    </h2>
                    {applications.map((app) => (
                        <button
                            key={app.id}
                            onClick={() => setSelectedApp(app)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${selectedApp?.id === app.id
                                ? 'bg-blue-50 border-blue-500 shadow-md'
                                : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                    {app.student.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 leading-tight">{app.student.name || 'Estudiante'}</h3>
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                        <Calendar className="w-3 h-3" /> {new Date(app.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <ArrowRight className={`w-4 h-4 ml-auto ${selectedApp?.id === app.id ? 'text-blue-500' : 'text-slate-300'}`} />
                            </div>
                        </button>
                    ))}
                    {applications.length === 0 && (
                        <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">
                            Aún no hay postulaciones para este proyecto.
                        </div>
                    )}
                </div>

                {/* Columna Derecha: Detalle de la Postulación y Acciones */}
                <div className="md:col-span-2">
                    {selectedApp ? (
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg h-full flex flex-col animate-in fade-in duration-300">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                                <User className="w-8 h-8 text-blue-600 p-1.5 bg-blue-50 rounded-lg" />
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{selectedApp.student.name}</h2>
                                    <p className="text-slate-500 text-sm">{selectedApp.student.email}</p>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                                    <FileText className="w-4 h-4 text-purple-600" /> Carta de Motivación
                                </h3>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">
                                        {selectedApp.motivation}
                                    </p>
                                </div>
                            </div>

                            {/* Botones de Decisión */}
                            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
                                <form action={async (formData) => {
                                    setIsProcessing(true);
                                    try {
                                        await rejectStudentAction(formData);
                                        setModalConfig({
                                            isOpen: true,
                                            type: 'warning',
                                            title: 'Solicitud Rechazada',
                                            message: `Has rechazado la solicitud de ${selectedApp.student.name}. Se le enviará un correo notificándole.`
                                        });
                                    } catch {
                                        setModalConfig({
                                            isOpen: true,
                                            type: 'error',
                                            title: 'Error',
                                            message: 'Hubo un error al procesar el rechazo.'
                                        });
                                    } finally {
                                        setIsProcessing(false);
                                    }
                                }} className="flex-1">
                                    <input type="hidden" name="applicationId" value={selectedApp.id} />
                                    <button disabled={isProcessing} className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50">
                                        <XCircle className="w-5 h-5" /> Rechazar
                                    </button>
                                </form>

                                <form action={async (formData) => {
                                    console.log("🖱️ [Client] Accept button clicked");
                                    setIsProcessing(true);
                                    try {
                                        await acceptStudentActionV2(formData);
                                        setModalConfig({
                                            isOpen: true,
                                            type: 'success',
                                            title: '¡Estudiante Aceptado!',
                                            message: `${selectedApp.student.name} ya es parte del proyecto. Se ha habilitado el espacio de trabajo y enviado el correo de bienvenida.`
                                        });
                                    } catch {
                                        console.error("❌ [Client] acceptStudentAction failed");
                                        setModalConfig({
                                            isOpen: true,
                                            type: 'error',
                                            title: 'Error de Servidor',
                                            message: 'No pudimos procesar la aceptación en este momento.'
                                        });
                                    } finally {
                                        setIsProcessing(false);
                                    }
                                }} className="flex-1">
                                    <input type="hidden" name="applicationId" value={selectedApp.id} />
                                    <input type="hidden" name="projectId" value={projectId} />
                                    <input type="hidden" name="studentId" value={selectedApp.student.id} />
                                    <button disabled={isProcessing} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all disabled:opacity-50">
                                        <CheckCircle2 className="w-5 h-5" /> Aceptar y Asignar Proyecto
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center text-slate-400 p-8">
                            <User className="w-12 h-12 mb-4 text-slate-300" />
                            <h3 className="text-lg font-bold text-slate-500">Selecciona un candidato</h3>
                            <p className="text-sm text-center mt-2 max-w-sm">Revisa sus motivaciones y decide quién es el mejor perfil para desarrollar este proyecto.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
