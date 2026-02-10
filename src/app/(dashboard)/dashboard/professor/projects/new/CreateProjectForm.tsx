'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Save, Loader2, BookOpen,
    Calendar, DollarSign, BarChart, Users, ClipboardCheck,
    Layers, Search, CheckSquare, AlertTriangle
} from 'lucide-react';
import { createProjectAction } from '@/app/actions/project-actions';
import { useModals } from '@/components/ModalProvider';

// Definición de tipo simple para la prop
type SimpleOA = {
    id: string;
    title: string;
    category: { name: string; color: string };
};

export default function CreateProjectForm({ availableOAs, defaultType, enforceType = false }: { availableOAs: SimpleOA[], defaultType?: 'PROJECT' | 'CHALLENGE' | 'PROBLEM', enforceType?: boolean }) {
    const router = useRouter();
    const { showAlert } = useModals();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'DISCARD' | 'PUBLISH' | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const submitBtnRef = useRef<HTMLButtonElement>(null);
    const [type, setType] = useState<'PROJECT' | 'CHALLENGE' | 'PROBLEM'>(defaultType || 'PROJECT');

    // CONTEXTO PEDAGÓGICO (Actualizado con definiciones estrictas)
    const typeConfig = {
        PROJECT: {
            label: "Proyecto (ABP)",
            description: "Se formula un tema o problema central abierto que motiva la investigación. Conectado con el currículo y con sentido en el aprendizaje.",
            icon: Layers,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200",
            placeholders: {
                description: "Contexto real y significativo (empresas, comunidad). Situación que conecta contenidos con práctica.",
                objectives: "Pregunta Guía: ¿Cómo mejorar...? (Tema central, estimulante y relevante).",
                methodology: "FASES ABP:\n1. Investigación y planificación (Definición de objetivos y tareas)\n2. Ejecución (Desarrollo de soluciones/prototipos)\n3. Presentación y evaluación (Socialización y reflexión)",
                deliverables: "Producto final tangible (Informe, Multimedia, Prototipo, Campaña)."
            }
        },
        CHALLENGE: {
            label: "Reto (ABR)",
            description: "Desafío de alcance social o comunitario que requiere una acción concreta. Tema amplio, realista y motivador.",
            icon: CheckSquare,
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-200",
            placeholders: {
                description: "Contexto auténtico con propósito social claro (Inclusión, Sostenibilidad, Comunidad).",
                objectives: "Pregunta Desafío. Reto inicial que requiere acción concreta.",
                methodology: "FASES ABR:\n1. Elección del reto\n2. Generación de preguntas\n3. Desarrollo (Investigación y diseño)\n4. Comprobación en contexto (Implementación)\n5. Difusión",
                deliverables: "Solución concreta con impacto (Prototipo funcional, Propuesta de cambio, Video divulgativo)."
            }
        },
        PROBLEM: {
            label: "Problema (ABP)",
            description: "Escenario o problema real, complejo y relevante que requiere aplicar conocimientos previos y desarrollar nuevos aprendizajes.",
            icon: Search,
            color: "text-red-600",
            bg: "bg-red-50",
            border: "border-red-200",
            placeholders: {
                description: "Escenario clínico, dilema social o reto profesional. Vinculado a situaciones reales.",
                objectives: "Análisis del problema. Identificación de vacíos de información y objetivos de aprendizaje.",
                methodology: "FASES ABP-Problemas:\n1. Presentación del problema\n2. Análisis y objetivos\n3. Investigación autónoma\n4. Síntesis y solución\n5. Evaluación y reflexión",
                deliverables: "Producto de comprensión (Informe analítico, Presentación argumentada, Modelo/Simulación)."
            }
        }
    };

    const currentConfig = typeConfig[type];

    // AI ASSISTANT STATE
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiTone, setAiTone] = useState('ACADEMIC');
    const [aiSearch, setAiSearch] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');

    async function handleAIGenerate() {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setAiError('');

        try {
            // Import dynamically to avoid server-side issues if any, though it's a server action
            const { generateProjectStructure } = await import('@/app/actions/ai-generator');
            const result = await generateProjectStructure(aiPrompt, type, { tone: aiTone, useSearch: aiSearch });

            if (!result.success || !result.data) {
                setAiError(result.error || 'Error desconocido al generar.');
                setIsGenerating(false);
                return;
            }

            const data = result.data;
            const form = document.querySelector('form') as HTMLFormElement;
            if (form) {
                const setNativeValue = (name: string, value: string) => {
                    const input = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement;
                    if (input) {
                        input.value = value;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                };
                setNativeValue('title', data.title);
                setNativeValue('industry', data.industry);
                setNativeValue('description', data.description);
                setNativeValue('justification', data.justification);

                // Ensure objectives is a string, even if AI returns an object/array by mistake
                const objectivesVal = typeof data.objectives === 'string' ? data.objectives : JSON.stringify(data.objectives, null, 2);
                setNativeValue('objectives', objectivesVal);

                setNativeValue('deliverables', data.deliverables);
                setNativeValue('schedule', data.schedule || '');
                setNativeValue('budget', data.budget || '');
                setNativeValue('evaluation', data.evaluation || '');
                setNativeValue('kpis', data.kpis || '');

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const phasesText = data.phases.map((p: any, i: number) => `### Fase ${i + 1}: ${p.title}\n${p.description}`).join('\n\n');
                setNativeValue('methodology', phasesText);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const resourcesText = data.suggestedResources.map((r: any) => `- [${r.title}](${r.url}) (${r.type})`).join('\n');
                setNativeValue('resourcesDescription', `### Recursos Sugeridos:\n${resourcesText}`);
            }

            setIsAIModalOpen(false);
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(error);
            setAiError('Error crítico de conexión. Intente de nuevo.');
        } finally {
            setIsGenerating(false);
        }
    }

    async function onSubmit(formData: FormData) {
        if (isSubmitting) return; // Prevent double submission
        setIsSubmitting(true);
        try {
            await createProjectAction(formData);
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            if (error.message === 'NEXT_REDIRECT' || error.digest?.includes('NEXT_REDIRECT')) {
                // Redirecting is normal behavior, ignore
                return;
            }
            console.error(error);
            await showAlert("Error", "Ocurrió un error al intentar crear el proyecto. Por favor, verifica los datos.", "error");
            setIsSubmitting(false); // Only reset on error
        }
    }

    const handleConfirm = () => {
        if (confirmAction === 'DISCARD') {
            router.back();
        } else if (confirmAction === 'PUBLISH') {
            // Trigger native form submission to handle validation and server action
            submitBtnRef.current?.click();
        }
        setConfirmAction(null);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 relative">
            {/* CONFIRMATION MODAL */}
            {confirmAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmAction === 'DISCARD' ? 'bg-red-100' : 'bg-blue-100'}`}>
                                {confirmAction === 'DISCARD' ? (
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                ) : (
                                    <Save className="w-6 h-6 text-blue-600" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                {confirmAction === 'DISCARD' ? '¿Descartar Cambios?' : '¿Publicar Proyecto?'}
                            </h3>
                            <p className="text-slate-500 mb-6 text-sm">
                                {confirmAction === 'DISCARD' ? (
                                    "Si sales ahora, perderás toda la información ingresada. Esta acción no se puede deshacer."
                                ) : (
                                    `Estás a punto de crear un nuevo ${type === 'PROJECT' ? 'Proyecto' : type === 'CHALLENGE' ? 'Reto' : 'Problema'}. ¿La información es correcta?`
                                )}
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg font-bold hover:opacity-90 transition-colors ${confirmAction === 'DISCARD' ? 'bg-red-600' : 'bg-slate-900'}`}
                                >
                                    {confirmAction === 'DISCARD' ? 'Sí, Descartar' : 'Sí, Publicar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

                        {/* AI OPTIONS CONTROLS */}
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tono</label>
                                <select
                                    value={aiTone}
                                    onChange={(e) => setAiTone(e.target.value)}
                                    className="w-full text-xs px-2 py-2 border rounded-lg bg-slate-50"
                                >
                                    <option value="ACADEMIC">Académico (Default)</option>
                                    <option value="CREATIVE">Creativo / Innovador</option>
                                    <option value="PROFESSIONAL">Corporativo</option>
                                    <option value="SIMPLE">Sencillo</option>
                                </select>
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={aiSearch}
                                        onChange={(e) => setAiSearch(e.target.checked)}
                                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-xs font-bold text-slate-600">Búsqueda Web</span>
                                </label>
                            </div>
                        </div>

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
                    </div >
                </div >
            )
            }

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

            <form ref={formRef} action={onSubmit} className="space-y-8">
                {/* Hidden submit button triggered programmatically */}
                <button type="submit" ref={submitBtnRef} className="hidden" />

                {/* SECCIÓN 0: TIPO DE INTERVENCIÓN (Only shown if type is not enforced) */}
                {!enforceType && (
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
                    </section>
                )}

                {/* Hidden Input for Server Action (Always needed) */}
                <input type="hidden" name="type" value={type} />

                {/* SECCIÓN 1: IDENTIFICACIÓN */}
                <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" /> 1. Identificación y Configuración
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

                            {/* NEW FIELDS: Dates & Students */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Máximo de Estudiantes</label>
                                <input
                                    type="number"
                                    name="maxStudents"
                                    placeholder="Opcional (Ilimitado si se deja vacío)"
                                    min="1"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Inicio (Publicación)</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Fecha de Cierre</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-600"
                                />
                            </div>
                        </div>
                    </div>


                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <input
                            type="checkbox"
                            name="isGroup"
                            id="isGroup"
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                            <label htmlFor="isGroup" className="block text-sm font-bold text-slate-700 cursor-pointer">Proyecto Grupal</label>
                            <p className="text-xs text-slate-500">Si se activa, todos los estudiantes compartirán el mismo tablero Kanban y tareas. Si no, cada estudiante tendrá su propio tablero individual.</p>
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
                        onClick={() => setConfirmAction('DISCARD')}
                        className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Descartar
                    </button>
                    <button
                        type="submit"
                        name="action"
                        value="draft"
                        disabled={isSubmitting}
                        className="px-8 py-3 text-slate-700 font-bold hover:bg-slate-100 bg-white border border-slate-300 rounded-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        Guardar Borrador
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmAction('PUBLISH')}
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
                    {/* Hidden input for PUBLISH action which is triggered via state/modal */}
                    {confirmAction === 'PUBLISH' && <input type="hidden" name="action" value="publish" />}
                    <button type="submit" className="hidden" ref={submitBtnRef} />
                </div>
            </form>
        </div >
    );
}
