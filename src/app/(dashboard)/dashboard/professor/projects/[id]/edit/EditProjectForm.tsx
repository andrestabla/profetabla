'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Briefcase, Save, Loader2, BookOpen,
    Users, ClipboardCheck,
    Layers, Search, ArrowLeft, CheckCircle2, XCircle, X
} from 'lucide-react';
import { updateProjectAction } from '@/app/actions/project-actions';

interface Project {
    id: string;
    title: string;
    description: string | null;
    industry: string | null;
    justification: string | null;
    objectives: string | null;
    deliverables: string | null;
    methodology: string | null;
    resourcesDescription: string | null;
    schedule: string | null;
    budget: string | null;
    evaluation: string | null;
    kpis: string | null;
    maxStudents: number | null;
    startDate: Date | null;
    endDate: Date | null;
    status: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
}

type NotificationType = 'success' | 'error' | null;

export default function EditProjectForm({ project }: { project: Project }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<NotificationType>(null);
    const [notificationMessage, setNotificationMessage] = useState('');

    async function onSubmit(formData: FormData) {
        setIsSubmitting(true);
        try {
            await updateProjectAction(formData);
            // If we reach here, the action succeeded (redirect will happen)
            setNotification('success');
            setNotificationMessage('¡Proyecto actualizado exitosamente!');
            // The redirect from the server action will handle navigation
        } catch (error) {
            console.error(error);
            setNotification('error');
            setNotificationMessage(
                error instanceof Error
                    ? error.message
                    : 'Error al actualizar el proyecto. Por favor, intenta nuevamente.'
            );
            setIsSubmitting(false);
        }
    }

    const closeModal = () => {
        setNotification(null);
        setNotificationMessage('');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Volver
            </button>

            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Editar Proyecto</h1>
                </div>
                <p className="text-slate-500">Actualiza los metadatos pedagógicos del proyecto.</p>
            </header>

            <form action={onSubmit} className="space-y-8">
                <input type="hidden" name="id" value={project.id} />

                {/* SECCIÓN 0: CONFIGURACIÓN Y VISIBILIDAD */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-600">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" /> Configuración y Visibilidad
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Estado del Proyecto</label>
                            <select
                                name="status"
                                defaultValue={project.status}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="DRAFT">🔲 Borrador (Oculto)</option>
                                <option value="OPEN">🟢 Abierto (Visible en Mercado)</option>
                                <option value="IN_PROGRESS">🚀 En Progreso</option>
                                <option value="COMPLETED">✅ Completado</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-2">
                                Solo los proyectos &quot;Abiertos&quot; son visibles para postulación.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Cupos Máximos</label>
                            <input
                                name="maxStudents"
                                type="number"
                                min="1"
                                defaultValue={project.maxStudents || ''}
                                placeholder="Sin límite"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Inicio (Publicación)</label>
                            <input
                                name="startDate"
                                type="date"
                                defaultValue={project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Cierre (Límite)</label>
                            <input
                                name="endDate"
                                type="date"
                                defaultValue={project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 1: IDENTIFICACIÓN */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" /> 1. Identificación y Contexto
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Título del Proyecto</label>
                            <input
                                name="title"
                                required
                                defaultValue={project.title}
                                placeholder="Ej: Reducción de la brecha digital..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Industria / Sector</label>
                                <input
                                    name="industry"
                                    defaultValue={project.industry || ''}
                                    placeholder="Ej: Fintech, Salud..."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Descripción General</label>
                            <textarea
                                name="description"
                                rows={3}
                                required
                                defaultValue={project.description || ''}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 2: FUNDAMENTACIÓN */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-500" /> 2. Fundamentación y Objetivos
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Justificación</label>
                            <textarea
                                name="justification"
                                rows={4}
                                required
                                defaultValue={project.justification || ''}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Objetivos</label>
                            <textarea
                                name="objectives"
                                rows={5}
                                defaultValue={project.objectives || ''}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 3: PLANIFICACIÓN */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-purple-500" /> 3. Planificación Estructural
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Fases y Actividades</label>
                            <textarea
                                name="methodology"
                                rows={5}
                                defaultValue={project.methodology || ''}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cronograma</label>
                                <textarea
                                    name="schedule"
                                    rows={4}
                                    defaultValue={project.schedule || ''}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Entregables</label>
                                <textarea
                                    name="deliverables"
                                    rows={4}
                                    defaultValue={project.deliverables || ''}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 4: RECURSOS Y PRESUPUESTO */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-500" /> 4. Recursos y Presupuesto
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Recursos</label>
                            <textarea
                                name="resourcesDescription"
                                rows={4}
                                defaultValue={project.resourcesDescription || ''}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Presupuesto</label>
                            <textarea
                                name="budget"
                                rows={3}
                                defaultValue={project.budget || ''}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 5: EVALUACIÓN */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-red-500" /> 5. Evaluación y Seguimiento
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Sistema de Evaluación</label>
                            <textarea
                                name="evaluation"
                                rows={4}
                                defaultValue={project.evaluation || ''}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Indicadores Key (KPIs)</label>
                            <textarea
                                name="kpis"
                                rows={3}
                                defaultValue={project.kpis || ''}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                </section>

                <div className="pt-6 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* SUCCESS MODAL */}
            {notification === 'success' && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Éxito!</h3>
                            <p className="text-slate-600 mb-6">{notificationMessage}</p>
                            <button
                                onClick={closeModal}
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR MODAL */}
            {notification === 'error' && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <XCircle className="w-10 h-10 text-red-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Error</h3>
                            <p className="text-slate-600 mb-6">{notificationMessage}</p>
                            <button
                                onClick={closeModal}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
