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

    // AI ASSISTANT STATE
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');

    async function handleAIGenerate() {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setAiError('');

        try {
            // Import dynamically to avoid server-side issues if any, though it's a server action
            const { generateProjectStructure } = await import('@/app/actions/ai-generator');
            const result = await generateProjectStructure(aiPrompt, type);

            if (!result.success || !result.data) {
                setAiError(result.error || 'Error desconocido al generar.');
                setIsGenerating(false);
                return;
            }

            const data = result.data;

            // Populate Form
            const form = document.querySelector('form') as HTMLFormElement;
            if (form) {
                // Helper to set value and dispatch event for React
                const setNativeValue = (name: string, value: string) => {
                    const input = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;
                    if (input) {
                        input.value = value;
                        // Dispatch input event to notify React (if needed for controlled inputs, though mostly uncontrolled here)
                        // Actually, this form seems uncontrolled (using name attributes). Direct manipulation works.
                    }
                };

                setNativeValue('title', data.title);
                setNativeValue('industry', data.industry);
                setNativeValue('description', data.description);
                setNativeValue('justification', data.justification);
                setNativeValue('objectives', data.objectives);
                setNativeValue('deliverables', data.deliverables);

                // For methodology/phases, we format them as text
                const phasesText = data.phases.map((p, i) => `Fase ${i + 1}: ${p.title}\n- ${p.description}`).join('\n\n');
                setNativeValue('methodology', phasesText);

                // Resources (append to resource desc or just leave for user)
                // We'll append to justification or resourcesDescription
                const resourcesText = data.suggestedResources.map(r => `- ${r.title} (${r.type})`).join('\n');
                setNativeValue('resourcesDescription', `Recursos Sugeridos:\n${resourcesText}`);
            }

            setIsAIModalOpen(false);
        } catch (error: any) {
            console.error(error);
            // Mostrar mensaje real del servidor si ocurriera un error fatal de red
            setAiError('Error crítico de conexión. Intente de nuevo.');
        } finally {
            setIsGenerating(false);
        }
    }

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
        <div className="max-w-4xl mx-auto p-6 relative">
            {/* AI MODAL */}
            {isAIModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-purple-600">
                                <Search className="w-5 h-5" />
                                <h3 className="text-xl font-bold">Asistente IA</h3>
                            </div>
                            <button onClick={() => setIsAIModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                &times;
                            </button>
                        </div>

                        <p className="text-slate-600 text-sm mb-4">
                            Describe tu idea brevemente y la IA estructurará el {currentConfig.label.toLowerCase()} por ti.
                        </p>

                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Ej: Crear un sistema de riego automatizado para zonas áridas en La Guajira..."
                            className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none mb-4"
                            autoFocus
                        />

                        {aiError && <p className="text-red-500 text-xs mb-4">{aiError}</p>}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsAIModalOpen(false)}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAIGenerate}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                {isGenerating ? 'Analizando...' : 'Generar Estructura'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${currentConfig.bg}`}>
                            <currentConfig.icon className={`w-6 h-6 ${currentConfig.color}`} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">Crear Nuevo {currentConfig.label}</h1>
                    </div>
                    <p className="text-slate-500">Define el alcance pedagógico seleccionando el tipo de intervención.</p>
                </div>
                <button
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-105"
                >
                    <Search className="w-4 h-4" />
                    Asistente IA
                </button>
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
