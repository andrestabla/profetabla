'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Briefcase, Save, Loader2, BookOpen,
    Calendar, DollarSign, BarChart, Users, ClipboardCheck,
    Layers, Search, CheckSquare
} from 'lucide-react';
import { createProjectAction } from '@/app/actions/project-actions';

// Definición de tipo simple para la prop
type SimpleOA = {
    id: string;
    title: string;
    category: { name: string; color: string };
};

export default function CreateProjectForm({ availableOAs }: { availableOAs: SimpleOA[] }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function onSubmit(formData: FormData) {
        setIsSubmitting(true);
        try {
            await createProjectAction(formData);
        } catch (error) {
            console.error(error);
            alert("Error al crear el proyecto");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Crear Nuevo Proyecto</h1>
                </div>
                <p className="text-slate-500">Completa los metadatos pedagógicos para estructurar tu propuesta educativa.</p>
            </header>

            <form action={onSubmit} className="space-y-8">
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
                                placeholder="Ej: Reducción de la brecha digital en estudiantes de Bachillerato..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                            <p className="text-xs text-slate-400 mt-1">Debe ser breve, claro y representativo.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Industria / Sector</label>
                                <input
                                    name="industry"
                                    placeholder="Ej: Fintech, Salud, Educación..."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Estado Inicial</label>
                                <select className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="OPEN">Abierto para Postulaciones</option>
                                    <option value="DRAFT">Borrador</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Descripción General</label>
                            <textarea
                                name="description"
                                rows={3}
                                required
                                placeholder="Resumen ejecutivo del proyecto..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
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
                            <label className="block text-sm font-bold text-slate-700 mb-2">Justificación (Por qué del proyecto)</label>
                            <textarea
                                name="justification"
                                rows={4}
                                required
                                placeholder="Describe el problema detectado y las razones que motivan esta intervención..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Objetivos (General y Específicos)</label>
                            <textarea
                                name="objectives"
                                rows={5}
                                placeholder="Objetivo General: Incrementar...&#10;Objetivos Específicos:&#10;- Implementar talleres...&#10;- Evaluar..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
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
                                placeholder="Fase 1: Diagnóstico (Actividades: encuestas, análisis)&#10;Fase 2: Diseño...&#10;Fase 3: Ejecución..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" /> Cronograma (Plazos)
                                </label>
                                <textarea
                                    name="schedule"
                                    rows={4}
                                    placeholder="Semana 1-2: Fase 1...&#10;Semana 3-6: Fase 2..."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Entregables (Hitos)</label>
                                <textarea
                                    name="deliverables"
                                    rows={4}
                                    placeholder="- Informe de Diagnóstico&#10;- Prototipo Funcional&#10;- Documentación Final"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
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
                            <label className="block text-sm font-bold text-slate-700 mb-2">Recursos (Humanos y Materiales)</label>
                            <textarea
                                name="resourcesDescription"
                                rows={4}
                                placeholder="Humanos: 1 Profesor líder, 2 Tutores.&#10;Materiales: Equipos informáticos, Licencias de software..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-500" /> Presupuesto Estimado
                            </label>
                            <textarea
                                name="budget"
                                rows={3}
                                placeholder="Detalle de costos y fuentes de financiamiento..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
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
                            <label className="block text-sm font-bold text-slate-700 mb-2">Sistema de Evaluación (Formativa y Sumativa)</label>
                            <textarea
                                name="evaluation"
                                rows={4}
                                placeholder="¿Cómo se medirá el avance? (Encuestas, rúbricas de evaluación final...)"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                <BarChart className="w-4 h-4 text-blue-500" /> Indicadores Clave (KPIs)
                            </label>
                            <textarea
                                name="kpis"
                                rows={3}
                                placeholder="Ej: % de mejora en calificación, Tasa de participación en talleres..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            />
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 6: OBJETOS DE APRENDIZAJE (NUEVO) */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-500" /> 6. Recursos de Aprendizaje (OAs)
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">Selecciona los Objetos de Aprendizaje que estarán disponibles para el estudiante desde el inicio.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                        {availableOAs.map(oa => (
                            <label key={oa.id} className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    name="selectedOAs"
                                    value={oa.id}
                                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <h4 className="font-bold text-slate-700 text-sm">{oa.title}</h4>
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                                        {oa.category.name}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>
                    {availableOAs.length === 0 && <p className="text-slate-400 italic">No hay OAs disponibles.</p>}
                </section>

                <div className="pt-6 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Descartar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Publicar Proyecto Pedagógico
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div >
    );
}
