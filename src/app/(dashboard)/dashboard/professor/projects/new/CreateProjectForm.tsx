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
    const [type, setType] = useState<'PROJECT' | 'CHALLENGE' | 'PROBLEM'>('PROJECT');

    // CONTEXTO PEDAGÓGICO
    const typeConfig = {
        PROJECT: {
            label: "Proyecto",
            description: "Construir, transformar o implementar algo con impacto sostenido.",
            icon: Layers,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
            placeholders: {
                description: "Contexto organizacional amplio. Ej: Implementación de un sistema de gestión...",
                objectives: "Objetivo General: Lograr un resultado complejo...\nEspecíficos: Diagnosticar, Diseñar, Validar...",
                methodology: "Fase 1: Diagnóstico\nFase 2: Diseño\nFase 3: Ejecución\nFase 4: Validación",
                deliverables: "- Documento de Diagnóstico\n- Prototipo Funcional\n- Manual de Usuario\n- Informe de Impacto"
            }
        },
        CHALLENGE: {
            label: "Reto",
            description: "Resolver algo puntual bajo restricciones claras (tiempo, recursos).",
            icon: CheckSquare,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-200",
            placeholders: {
                description: "Situación específica y delimitada. Ej: Optimizar el tiempo de respuesta del servidor...",
                objectives: "Resolver el problema X reduciendo Y en Z tiempo.",
                methodology: "1. Comprender\n2. Idear\n3. Prototipar\n4. Proponer",
                deliverables: "- Pitch de Solución\n- Prototipo Rápido"
            }
        },
        PROBLEM: {
            label: "Problema",
            description: "Analizar, comprender y explicar una situación crítica.",
            icon: Search,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200",
            placeholders: {
                description: "Descripción basada en hechos, datos o síntomas de una disfunción...",
                objectives: "Comprender las causas raíz de X y proponer alternativas fundamentadas.",
                methodology: "1. Recolección de Datos\n2. Análisis Causa-Efecto\n3. Contrastación Teórica\n4. Conclusiones",
                deliverables: "- Árbol de Problemas\n- Informe Analítico\n- Matriz de Hallazgos"
            }
        }
    };

    const currentConfig = typeConfig[type];

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
                    <div className={`p-2 rounded-lg ${currentConfig.bg}`}>
                        <currentConfig.icon className={`w-6 h-6 ${currentConfig.color}`} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Crear Nuevo {currentConfig.label}</h1>
                </div>
                <p className="text-slate-500">Define el alcance pedagógico seleccionando el tipo de intervención.</p>
            </header>

            <form action={onSubmit} className="space-y-8">
                {/* SECCIÓN 0: TIPO DE INTERVENCIÓN */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Selecciona el Tipo de Intervención</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((key) => {
                            const config = typeConfig[key];
                            const isSelected = type === key;
                            return (
                                <div
                                    key={key}
                                    onClick={() => setType(key)}
                                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${isSelected ? `${config.border} ${config.bg} ring-2 ring-offset-2 ring-blue-100` : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <config.icon className={`w-5 h-5 ${config.color}`} />
                                        <h3 className={`font-bold ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>{config.label}</h3>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{config.description}</p>
                                </div>
                            )
                        })}
                    </div>
                    {/* Hidden Input for Server Action */}
                    <input type="hidden" name="type" value={type} />
                </section>

                {/* SECCIÓN 1: IDENTIFICACIÓN */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" /> 1. Identificación y Contexto
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Título del {currentConfig.label}</label>
                            <input
                                name="title"
                                required
                                placeholder={`Ej: ${type === 'PROJECT' ? 'Implementación de...' : type === 'CHALLENGE' ? 'Optimizar el proceso de...' : 'Análisis de la crisis en...'}`}
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
                                placeholder={currentConfig.placeholders.description}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-slate-400"
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
                                placeholder="Describe la relevancia pedagógica, social o productiva..."
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Objetivos</label>
                            <textarea
                                name="objectives"
                                rows={5}
                                placeholder={currentConfig.placeholders.objectives}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-slate-400"
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
                            <label className="block text-sm font-bold text-slate-700 mb-2">Fases y Actividades Sugeridas</label>
                            <textarea
                                name="methodology"
                                rows={5}
                                placeholder={currentConfig.placeholders.methodology}
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-slate-400"
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
                                    placeholder="Cronograma estimado..."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Entregables Esperados</label>
                                <textarea
                                    name="deliverables"
                                    rows={4}
                                    placeholder={currentConfig.placeholders.deliverables}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all placeholder:text-slate-400"
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
                                placeholder="Recursos necesarios..."
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
                                placeholder="Detalle de costos..."
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
                            <label className="block text-sm font-bold text-slate-700 mb-2">Sistema de Evaluación</label>
                            <textarea
                                name="evaluation"
                                rows={4}
                                placeholder="¿Cómo se medirá el avance?"
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
                                placeholder="Ej: % de cumplimiento..."
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
                    <p className="text-sm text-slate-500 mb-6">Selecciona los Objetos de Aprendizaje disponibles.</p>

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
                                Publicar {currentConfig.label}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div >
    );
}
