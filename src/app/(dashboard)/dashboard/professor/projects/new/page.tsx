'use client';

import { useState } from 'react';
import { BookOpen, Target, Briefcase, CheckCircle, Save, Loader2 } from 'lucide-react';
import { createProjectAction } from './actions';

export default function CreateProjectPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                {/* BLOQUE 1: Información Básica */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-slate-800">1. Información del Reto</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título del Proyecto</label>
                            <input
                                name="title"
                                required
                                placeholder="Ej: Desarrollo de plataforma E-commerce con React"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción Corta</label>
                            <textarea
                                name="description"
                                rows={2}
                                placeholder="Resumen de 2 líneas sobre qué trata el proyecto..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* BLOQUE 2: Contexto de Industria */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-slate-800">2. Contexto de Industria (Justificación)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Industria / Sector</label>
                            <input
                                name="industry"
                                placeholder="Ej: Fintech, Salud, Retail, SaaS"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">¿Por qué es relevante este proyecto hoy?</label>
                            <textarea
                                name="justification"
                                rows={3}
                                placeholder="Explica la demanda actual del mercado para estas habilidades..."
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
                                rows={3}
                                placeholder="¿Qué aprenderá el estudiante técnicamente y humanamente?"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Productos Entregables (Deliverables)</label>
                            <textarea
                                name="deliverables"
                                rows={3}
                                placeholder="Lista de artefactos finales (Código, Documentación, Video Demo...)"
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
                        Publicar Proyecto
                    </button>
                </div>
            </form>
        </div>
    );
}
