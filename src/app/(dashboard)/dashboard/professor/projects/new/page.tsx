'use client';

import { useState } from 'react';
import { BookOpen, Target, Briefcase, Save, Loader2, Sparkles } from 'lucide-react';
import { createProjectAction } from './actions';
import { generateProjectStructure, AIProjectStructure } from '@/app/actions/ai-generator';

export default function CreateProjectPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Estados para los campos que la IA autocompleta
    const [title, setTitle] = useState('');
    const [industry, setIndustry] = useState('');
    const [description, setDescription] = useState('');
    const [justification, setJustification] = useState('');
    const [objectives, setObjectives] = useState('');
    const [deliverables, setDeliverables] = useState('');

    // Estados para la estructura generada (Kanban y Recursos)
    const [generatedTasks, setGeneratedTasks] = useState<AIProjectStructure['phases']>([]);
    const [generatedResources, setGeneratedResources] = useState<AIProjectStructure['suggestedResources']>([]);

    const handleAIGenerate = async () => {
        if (!title || !industry) {
            alert("Por favor escribe un Título e Industria para que la IA tenga contexto.");
            return;
        }

        setIsGenerating(true);
        try {
            const aiData = await generateProjectStructure(title, industry);

            // Rellenamos el formulario automáticamente
            setJustification(aiData.justification);
            setObjectives(aiData.objectives);
            setDeliverables(aiData.deliverables);
            setDescription(aiData.justification.slice(0, 150) + "..."); // Resumen simple

            setGeneratedTasks(aiData.phases);
            setGeneratedResources(aiData.suggestedResources);

            alert(`¡Éxito! La IA ha generado ${aiData.phases.length} fases para el Kanban y ${aiData.suggestedResources.length} recursos sugeridos.`);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            alert("Error generando con IA: " + (e as any).message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Crear Nuevo Proyecto</h1>
                <p className="text-slate-500">Define el reto de industria y los objetivos de aprendizaje para tus estudiantes.</p>
            </header>

            <form
                action={async (formData) => {
                    setIsSubmitting(true);
                    await createProjectAction(formData);
                }}
                className="space-y-8"
            >
                {/* BLOQUE 1: Información Básica e IA */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Sparkles className="w-32 h-32 text-indigo-500" />
                    </div>

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-slate-800">1. Información del Reto</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleAIGenerate}
                            disabled={isGenerating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 disabled:opacity-70"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {isGenerating ? 'Generando...' : 'Autocompletar con IA'}
                        </button>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título del Proyecto *</label>
                                <input
                                    name="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="Ej: E-commerce con React"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Industria / Sector *</label>
                                <input
                                    name="industry"
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    required
                                    placeholder="Ej: Retail, Fintech"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción Corta</label>
                            <textarea
                                name="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                placeholder="Resumen breve..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* VISTA PREVIA DE LO GENERADO */}
                    {generatedTasks.length > 0 && (
                        <div className="mt-6 bg-indigo-50 border border-indigo-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-4">
                            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2 text-sm">
                                <Sparkles className="w-4 h-4" /> Estructura Sugerida (Se creará automáticamente):
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-indigo-800">
                                <div>
                                    <strong className="block mb-1 text-indigo-950">Fases Kanban:</strong>
                                    <ul className="list-disc list-inside space-y-1 pl-1">
                                        {generatedTasks.map((t, i) => (
                                            <li key={i}>{t.title} <span className="opacity-70">({t.priority})</span></li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <strong className="block mb-1 text-indigo-950">Recursos:</strong>
                                    <ul className="list-disc list-inside space-y-1 pl-1">
                                        {generatedResources.map((r, i) => (
                                            <li key={i}>{r.title}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {/* Inputs ocultos para enviar al server action */}
                            <input type="hidden" name="aiTasks" value={JSON.stringify(generatedTasks)} />
                            <input type="hidden" name="aiResources" value={JSON.stringify(generatedResources)} />
                        </div>
                    )}
                </div>

                {/* BLOQUE 2: Contexto de Industria */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-slate-800">2. Contexto de Industria (Justificación)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">¿Por qué es relevante este proyecto hoy?</label>
                            <textarea
                                name="justification"
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* BLOQUE 3: Resultados Esperados */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-semibold text-slate-800">3. Resultados de Aprendizaje</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Objetivos (Competencias)</label>
                            <textarea
                                name="objectives"
                                value={objectives}
                                onChange={(e) => setObjectives(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Productos Entregables (Deliverables)</label>
                            <textarea
                                name="deliverables"
                                value={deliverables}
                                onChange={(e) => setDeliverables(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 pb-8">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {isSubmitting ? 'Creando...' : 'Publicar Proyecto'}
                    </button>
                </div>
            </form>
        </div>
    );
}
